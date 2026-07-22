import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolvedCredential } from '../../kernel/config/credentials.js';
import { CliError } from '../../kernel/error.js';
import type { CliContext } from '../../kernel/run.js';
import { createUi } from '../../kernel/ui.js';
import { type DataCollection, writeDataFiles } from '../../sync/data-store.js';
import { partitionCollections, prepareDataPush, previewData, remapSystemRecord } from './data-push.js';
import type { Target } from './resolve-target.js';

// Keep unit tests off the network; the rejection also exercises conservative unchanged detection.
vi.mock('../../sync/api.js', () => ({
	fetchRecords: vi.fn(() => Promise.reject(new Error('no network in unit tests'))),
	importBatch: vi.fn(),
}));

const bucket = {
	directus_access: { a1: 'ta1' },
	directus_roles: { sr: 'tr' },
	directus_policies: { sp: 'tp' },
};

describe('remapSystemRecord', () => {
	it('replaces the primary key and every static FK with its target-space id, reporting the send pair', () => {
		// The whole safety of a repeat import rests on this: a source record must land as its already-known
		// target record (PK) and point its FKs at the target's rows (role/policy), or the import duplicates
		// or dangles. The send pair is what push later writes back into the map from the import response.
		const { record, sent } = remapSystemRecord(
			{ id: 'a1', role: 'sr', policy: 'sp', user: null },
			'directus_access',
			'id',
			bucket,
		);

		expect(record).toEqual({ id: 'ta1', role: 'tr', policy: 'tp', user: null });
		expect(sent).toEqual({ sourceId: 'a1', sentPk: 'ta1' });
	});

	it('leaves an FK with no mapping verbatim — an in-batch new record or a genuine dangle, never a guess', () => {
		// A miss must not be invented: the referenced row may be a new record the server links in the same
		// batch, or a genuinely missing reference the server should reject loudly. Either way the CLI must
		// not fabricate a target id.
		const { record } = remapSystemRecord(
			{ id: 'a1', role: 'unmapped', policy: 'sp', user: null },
			'directus_access',
			'id',
			bucket,
		);

		expect(record['role']).toBe('unmapped');
		expect(record['policy']).toBe('tp');
	});

	it('leaves the primary key verbatim on a miss and reports sentPk as the source id', () => {
		// A first-import record has no mapping yet: it keeps its source PK (the server inserts and remaps),
		// and sentPk must be that source PK so push can pair it with the import response's remap.
		const { record, sent } = remapSystemRecord({ id: 'sr', name: 'Editor' }, 'directus_roles', 'id', bucket);

		expect(record['id']).toBe('tr');
		expect(sent).toEqual({ sourceId: 'sr', sentPk: 'tr' });

		const miss = remapSystemRecord({ id: 'new', name: 'New' }, 'directus_roles', 'id', bucket);
		expect(miss.record['id']).toBe('new');
		expect(miss.sent).toEqual({ sourceId: 'new', sentPk: 'new' });
	});

	it('never mutates the input record and leaves non-key fields untouched', () => {
		// The remap is pure — the on-disk record is owned by the store, and a mutation would corrupt a later
		// read or a second remap. Only the PK and static FK fields change; everything else passes through.
		const input = { id: 'sr', name: 'Editor', icon: 'shield', parent: null };
		const { record } = remapSystemRecord(input, 'directus_roles', 'id', bucket);

		expect(input.id).toBe('sr');
		expect(record).toEqual({ id: 'tr', name: 'Editor', icon: 'shield', parent: null });
	});
});

function content(collection: string): DataCollection {
	return { collection, primaryKey: 'id', records: [] };
}

describe('partitionCollections', () => {
	it('orders system collections dependencies-first and codepoint-sorts content after them', () => {
		// Keep system resources in the graph's import order and user content deterministic after them.
		const { system, content: contentOut } = partitionCollections([
			content('zebra'),
			content('directus_roles'),
			content('apple'),
			content('directus_access'),
			content('directus_policies'),
		]);

		expect(system.map((entry) => entry.data.collection)).toEqual([
			'directus_access',
			'directus_policies',
			'directus_roles',
		]);

		expect(contentOut.map((entry) => entry.collection)).toEqual(['apple', 'zebra']);
	});

	it('keeps a system collection without a natural key (directus_panels) in the system partition', () => {
		// panels has no natural key, so it is never reconciled — but it is still a graph member that must be
		// remapped (PK + dashboard FK), so it belongs in system, not content.
		const { system, content: contentOut } = partitionCollections([content('directus_panels'), content('notes')]);

		expect(system.map((entry) => entry.data.collection)).toEqual(['directus_panels']);
		expect(contentOut.map((entry) => entry.collection)).toEqual(['notes']);
	});
});

describe('prepareDataPush skip and precondition', () => {
	const credential: ResolvedCredential = { kind: 'token', url: 'https://cms.example.com', token: 't' };
	let dir: string;

	function target(): Target {
		return {
			url: 'https://cms.example.com',
			credential,
			project: 'default',
			schemaDir: join(dir, 'schema'),
			dataDir: join(dir, 'data'),
			idMapPath: join(dir, 'id_map.json'),
			projectConfig: undefined,
		};
	}

	function ctx(): CliContext {
		return { cwd: dir, configPath: undefined, interactive: false, ui: createUi({ json: false, color: false }) };
	}

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'd6s-datapush-'));
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	it('returns skipped when the data directory is absent (a schema-only checkout)', async () => {
		// Older checkouts committed schema without data; push must still run and report the data phase
		// skipped rather than failing. No credential is touched — the skip precedes any network work.
		await expect(prepareDataPush(target(), 'merge', ctx())).resolves.toEqual({ skipped: true });
	});

	it('returns skipped when the committed data set is empty', async () => {
		writeDataFiles(join(dir, 'data'), [], 'https://source.example.com');

		await expect(prepareDataPush(target(), 'merge', ctx())).resolves.toEqual({ skipped: true });
	});

	it('refuses loud when the committed data predates source tracking', async () => {
		// The source keys the ID map bucket; data written before it was recorded cannot be remapped safely,
		// so prepareDataPush propagates the store's STATE refusal rather than guessing a source.
		writeDataFiles(
			join(dir, 'data'),
			[{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'r1' }] }],
			'https://source.example.com',
		);

		const metadataPath = join(dir, 'data', 'metadata.json');
		const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
		delete metadata.source;
		writeFileSync(metadataPath, JSON.stringify(metadata));

		const error = await prepareDataPush(target(), 'merge', ctx()).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).code).toBe('STATE');
	});

	it('previewData skips a schema-only checkout without touching the credential', async () => {
		// An absent data directory is a schema-only checkout: the preview skips exactly as the push path does,
		// before any network work.
		await expect(previewData(target(), 'merge')).resolves.toEqual({ skipped: true });
	});

	it('previewData assembles the content batch, tallies zero, and never writes the id map', async () => {
		// Content-only data reconciles nothing (content is never matched), so the preview passes it through
		// verbatim, reports all-zero counts, and — the read-only invariant — leaves no id_map.json behind.
		// The content-target fetch for the unchanged comparison fails here (the api seam is mocked to
		// reject), which must degrade to "compare nothing, keep everything" — never an error.
		writeDataFiles(
			join(dir, 'data'),
			[{ collection: 'articles', primaryKey: 'id', records: [{ id: 1, title: 'Hello' }] }],
			'https://source.example.com',
		);

		const preview = await previewData(target(), 'merge');

		expect(preview).toEqual({
			skipped: false,
			source: 'https://source.example.com',
			batch: [{ collection: 'articles', items: [{ id: 1, title: 'Hello' }] }],
			unchanged: new Map(),
			records: 1,
			matchedCount: 0,
			ambiguousCount: 0,
			unmatchedCount: 0,
			unchangedCount: 0,
		});

		expect(existsSync(join(dir, 'id_map.json'))).toBe(false);
	});
});
