import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolvedCredential } from '../kernel/config/credentials.js';
import { createConfigStore } from '../kernel/config/file.js';
import { CliError } from '../kernel/error.js';
import type { CliContext } from '../kernel/run.js';
import { createUi } from '../kernel/ui.js';
import { fetchRecords } from './api.js';
import { partitionCollections, prepareDataPush, previewData, remapSystemRecord } from './data-push.js';
import { type DataCollection, writeDataFiles } from './data-store.js';
import type { Target } from './resolve-target.js';
import { allResources, type Resource } from './resources.js';

vi.mock('./api.js', () => ({
	fetchRecords: vi.fn(() => Promise.resolve([])),
	importBatch: vi.fn(),
}));

function resource(collection: string): Resource {
	const found = allResources().find((entry) => entry.collection === collection);
	if (found === undefined) throw new Error(`no resource for ${collection}`);
	return found;
}

const bucket = {
	directus_access: { a1: 'ta1' },
	directus_roles: { sr: 'tr' },
	directus_policies: { sp: 'tp' },
	directus_folders: { fChild: 'tChild', fParent: 'tParent' },
};

describe('remapSystemRecord', () => {
	it('replaces the primary key and every static FK with its target-space id, reporting the send pair', () => {
		const { record, sent } = remapSystemRecord(
			{ id: 'a1', role: 'sr', policy: 'sp', user: null },
			resource('directus_access'),
			bucket,
		);

		expect(record).toEqual({ id: 'ta1', role: 'tr', policy: 'tp', user: null });
		expect(sent).toEqual({ sourceId: 'a1', sentPk: 'ta1' });
	});

	it('leaves an FK with no mapping verbatim — an in-batch new record or a genuine dangle, never a guess', () => {
		const { record } = remapSystemRecord(
			{ id: 'a1', role: 'unmapped', policy: 'sp', user: null },
			resource('directus_access'),
			bucket,
		);

		expect(record['role']).toBe('unmapped');
		expect(record['policy']).toBe('tp');
	});

	it('leaves the primary key verbatim on a miss and reports sentPk as the source id', () => {
		const { record, sent } = remapSystemRecord({ id: 'sr', name: 'Editor' }, resource('directus_roles'), bucket);

		expect(record['id']).toBe('tr');
		expect(sent).toEqual({ sourceId: 'sr', sentPk: 'tr' });

		const miss = remapSystemRecord({ id: 'new', name: 'New' }, resource('directus_roles'), bucket);
		expect(miss.record['id']).toBe('new');
		expect(miss.sent).toEqual({ sourceId: 'new', sentPk: 'new' });
	});

	it('remaps a folder onto its target id and its parent onto the target parent — the self-ref tree survives', () => {
		const { record, sent } = remapSystemRecord(
			{ id: 'fChild', name: 'Images', parent: 'fParent' },
			resource('directus_folders'),
			bucket,
		);

		expect(record).toEqual({ id: 'tChild', name: 'Images', parent: 'tParent' });
		expect(sent).toEqual({ sourceId: 'fChild', sentPk: 'tChild' });
	});

	it('never mutates the input record and leaves non-key fields untouched', () => {
		const input = { id: 'sr', name: 'Editor', icon: 'shield', parent: null };
		const { record } = remapSystemRecord(input, resource('directus_roles'), bucket);

		expect(input.id).toBe('sr');
		expect(record).toEqual({ id: 'tr', name: 'Editor', icon: 'shield', parent: null });
	});
});

function content(collection: string): DataCollection {
	return { collection, primaryKey: 'id', records: [] };
}

describe('partitionCollections', () => {
	it('orders system collections dependencies-first and codepoint-sorts content after them', () => {
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
		return {
			cwd: dir,
			config: createConfigStore(dir),
			interactive: false,
			ui: createUi({ json: false, color: false }),
		};
	}

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'd6s-datapush-'));
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
		vi.mocked(fetchRecords).mockReset();
	});

	it('plans nothing for a schema-only checkout or an empty committed data set', async () => {
		await expect(prepareDataPush(target(), 'merge', ctx())).resolves.toBeUndefined();

		writeDataFiles(join(dir, 'data'), [], 'https://source.example.com');

		await expect(prepareDataPush(target(), 'merge', ctx())).resolves.toBeUndefined();
	});

	it('refuses loud when the committed data predates source tracking', async () => {
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

	it('refuses a data file whose declared primaryKey contradicts the catalog, before any network', async () => {
		writeDataFiles(
			join(dir, 'data'),
			[{ collection: 'directus_roles', primaryKey: 'name', records: [{ id: 'r1', name: 'Editor' }] }],
			'https://source.example.com',
		);

		vi.mocked(fetchRecords).mockClear();

		const error = await prepareDataPush(target(), 'merge', ctx()).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).code).toBe('STATE');
		expect((error as CliError).message).toContain('directus_roles');
		expect((error as CliError).message).toContain('"name"');
		expect((error as CliError).message).toContain('"id"');
		expect(fetchRecords).not.toHaveBeenCalled();
	});

	it('refuses an unknown directus_* data file as an unsynced system collection, not as content', async () => {
		writeDataFiles(
			join(dir, 'data'),
			[{ collection: 'directus_presets', primaryKey: 'id', records: [{ id: 1 }] }],
			'https://source.example.com',
		);

		vi.mocked(fetchRecords).mockClear();

		const error = await prepareDataPush(target(), 'merge', ctx()).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).code).toBe('STATE');
		expect((error as CliError).message).toContain('system collections this CLI version does not sync');
		expect((error as CliError).message).toContain('directus_presets');
		expect((error as CliError).message).not.toMatch(/content collection/);
		expect(fetchRecords).not.toHaveBeenCalled();
	});

	it('withholds an unmatched numeric PK so the server assigns one the next pull can reconcile', async () => {
		writeDataFiles(
			join(dir, 'data'),
			[
				{
					collection: 'directus_permissions',
					primaryKey: 'id',
					records: [{ id: 7, policy: null, collection: 'articles', action: 'read' }],
				},
			],
			'https://source.example.com',
		);

		const plan = await prepareDataPush(target(), 'merge', ctx());

		expect(plan?.batch).toEqual([
			{ collection: 'directus_permissions', items: [{ policy: null, collection: 'articles', action: 'read' }] },
		]);

		expect(plan?.systemSent).toEqual([
			{ collection: 'directus_permissions', records: [{ sourceId: '7', sentPk: null }] },
		]);
	});

	it('reconciles a translation and sends its full single-row update to the target ID', async () => {
		writeDataFiles(
			join(dir, 'data'),
			[
				{
					collection: 'directus_translations',
					primaryKey: 'id',
					records: [{ id: 'source-id', language: 'en-US', key: 'greeting', value: 'Hello' }],
				},
			],
			'https://source.example.com',
		);

		vi.mocked(fetchRecords).mockResolvedValue([
			{ id: 'target-id', language: 'en-US', key: 'greeting', value: 'Old value' },
		]);

		const plan = await prepareDataPush(target(), 'mirror', ctx());

		expect(plan?.batch).toEqual([
			{
				collection: 'directus_translations',
				items: [{ id: 'target-id', language: 'en-US', key: 'greeting', value: 'Hello' }],
			},
		]);
	});

	it('previewData skips a schema-only checkout without touching the credential', async () => {
		await expect(previewData(target(), 'merge')).resolves.toBeUndefined();
	});

	it('previewData excludes the dependents of an ambiguous source along with it, keeping unaffected rows', async () => {
		writeDataFiles(
			join(dir, 'data'),
			[
				{
					collection: 'directus_roles',
					primaryKey: 'id',
					records: [
						{ id: 'r-amb', name: 'Editor' },
						{ id: 'r-ok', name: 'Viewer', icon: 'eye' },
					],
				},
				{
					collection: 'directus_access',
					primaryKey: 'id',
					records: [
						{ id: 'a-amb', role: 'r-amb', user: null, policy: null },
						{ id: 'a-ok', role: 'r-ok', user: null, policy: null },
					],
				},
			],
			'https://source.example.com',
		);

		vi.mocked(fetchRecords).mockImplementation((_credential, source) =>
			Promise.resolve(
				source.endpoint === '/roles'
					? [
							{ id: 't-ed-1', name: 'Editor' },
							{ id: 't-ed-2', name: 'Editor' },
							{ id: 't-viewer', name: 'Viewer' },
						]
					: [],
			),
		);

		const preview = await previewData(target(), 'merge');

		expect(preview).toMatchObject({
			batch: [
				{ collection: 'directus_access', items: [{ id: 'a-ok', role: 't-viewer', user: null, policy: null }] },
				{ collection: 'directus_roles', items: [{ id: 't-viewer', name: 'Viewer', icon: 'eye' }] },
			],
			records: 2,
			matchedCount: 1,
			ambiguousCount: 2,
			unmatchedCount: 1,
		});
	});

	it('previewData drops a whole folder chain under an ambiguous parent, to a fixed point', async () => {
		writeDataFiles(
			join(dir, 'data'),
			[
				{
					collection: 'directus_folders',
					primaryKey: 'id',
					records: [
						{ id: 'f-grand', name: 'Icons', parent: 'f-child' },
						{ id: 'f-child', name: 'Images', parent: 'f-amb' },
						{ id: 'f-amb', name: 'Assets', parent: null },
					],
				},
			],
			'https://source.example.com',
		);

		vi.mocked(fetchRecords).mockImplementation((_credential, source) =>
			Promise.resolve(
				source.endpoint === '/folders'
					? [
							{ id: 't-a1', name: 'Assets', parent: null },
							{ id: 't-a2', name: 'Assets', parent: null },
						]
					: [],
			),
		);

		const preview = await previewData(target(), 'merge');

		expect(preview).toMatchObject({
			batch: [{ collection: 'directus_folders', items: [] }],
			records: 0,
			matchedCount: 0,
			ambiguousCount: 3,
			unmatchedCount: 0,
		});
	});

	it('previewData excludes a matched child of an ambiguous parent and moves it out of matchedCount', async () => {
		writeDataFiles(
			join(dir, 'data'),
			[
				{
					collection: 'directus_folders',
					primaryKey: 'id',
					records: [
						{ id: 'f-amb', name: 'Assets', parent: null },
						{ id: 'f-child', name: 'Images', parent: 'f-amb' },
					],
				},
			],
			'https://source.example.com',
		);

		vi.mocked(fetchRecords).mockImplementation((_credential, source) =>
			Promise.resolve(
				source.endpoint === '/folders'
					? [
							{ id: 't-a1', name: 'Assets', parent: null },
							{ id: 't-a2', name: 'Assets', parent: null },
							{ id: 't-img', name: 'Images', parent: 't-a1' },
						]
					: [],
			),
		);

		const preview = await previewData(target(), 'merge');

		expect(preview).toMatchObject({
			batch: [{ collection: 'directus_folders', items: [] }],
			records: 0,
			matchedCount: 0,
			ambiguousCount: 2,
			unmatchedCount: 0,
		});
	});

	it('previewData keeps a null-FK row when its collection has excluded rows', async () => {
		writeDataFiles(
			join(dir, 'data'),
			[
				{
					collection: 'directus_roles',
					primaryKey: 'id',
					records: [
						{ id: 'r-amb', name: 'Editor', parent: null },
						{ id: 'r-solo', name: 'Solo', parent: null },
					],
				},
			],
			'https://source.example.com',
		);

		vi.mocked(fetchRecords).mockImplementation((_credential, source) =>
			Promise.resolve(
				source.endpoint === '/roles'
					? [
							{ id: 't-ed-1', name: 'Editor', parent: null },
							{ id: 't-ed-2', name: 'Editor', parent: null },
						]
					: [],
			),
		);

		const preview = await previewData(target(), 'merge');

		expect(preview).toMatchObject({
			batch: [{ collection: 'directus_roles', items: [{ id: 'r-solo', name: 'Solo', parent: null }] }],
			records: 1,
			matchedCount: 0,
			ambiguousCount: 1,
			unmatchedCount: 1,
		});
	});

	it('previewData assembles the batch, tallies the reconcile counts, and never writes the id map', async () => {
		writeDataFiles(
			join(dir, 'data'),
			[{ collection: 'directus_flows', primaryKey: 'id', records: [{ id: 'f1', name: 'Deploy' }] }],
			'https://source.example.com',
		);

		const preview = await previewData(target(), 'merge');

		expect(preview).toEqual({
			source: 'https://source.example.com',
			batch: [{ collection: 'directus_flows', items: [{ id: 'f1', name: 'Deploy' }] }],
			unchanged: new Map(),
			records: 1,
			matchedCount: 0,
			ambiguousCount: 0,
			unmatchedCount: 1,
			unchangedCount: 0,
			incomplete: [],
		});

		expect(existsSync(join(dir, 'id_map.json'))).toBe(false);
	});
});
