import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { confirm, isCancel, select, text } from '@clack/prompts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CliContext } from '../../kernel/run.js';
import { createUi } from '../../kernel/ui.js';
import { applyDiff, fetchDiff, fetchRecords, importBatch } from '../../sync/api.js';
import type { DiffResult, ImportBatchResult } from '../../sync/contract.js';
import { writeDataFiles } from '../../sync/data-store.js';
import { writeSnapshotFiles } from '../../sync/store.js';
import { push } from './push.js';
import { seedProjectConfig, SYNC_TOKEN, SYNC_URL } from './sync.test-support.js';

// vitest hoists these above the imports, so the bindings above resolve to the mocks. The prompts are
// mocked to script the confirm/text/select answers, and the api seam is mocked so the interactive gate
// and reconcile logic are tested in isolation from the wire — the assertions are about which gate fired,
// whether apply/import ran, and what landed in the committed map.
vi.mock('@clack/prompts', () => ({
	confirm: vi.fn(),
	text: vi.fn(),
	select: vi.fn(),
	isCancel: vi.fn(() => false),
}));

vi.mock('../../sync/api.js', () => ({
	fetchDiff: vi.fn(),
	applyDiff: vi.fn(),
	fetchRecords: vi.fn(),
	importBatch: vi.fn(),
}));

const url = SYNC_URL;
const token = SYNC_TOKEN;

function ctxAt(cwd: string): CliContext {
	return { cwd, configPath: undefined, interactive: true, ui: createUi({ json: false, color: false }) };
}

function changesResult(): DiffResult {
	return {
		hash: 'h1',
		diff: {
			collections: [{ collection: 'events', diff: [{ kind: 'N', rhs: { collection: 'events' } }] }],
			fields: [],
			systemFields: [],
			relations: [],
		},
	};
}

function deletionResult(): DiffResult {
	return {
		hash: 'h1',
		diff: {
			collections: [],
			fields: [{ collection: 'articles', field: 'old_slug', diff: [{ kind: 'D', lhs: { field: 'old_slug' } }] }],
			systemFields: [],
			relations: [],
		},
	};
}

describe('interactive sync push', () => {
	let dir: string;
	let home: string;
	let stderr: string[];

	function seedSnapshot(): void {
		writeSnapshotFiles(join(dir, 'directus', 'default', 'schema'), {
			version: 1,
			directus: '11.0.0',
			vendor: 'postgres',
			collections: [{ collection: 'articles', meta: { note: null } }],
			fields: [{ collection: 'articles', field: 'title', type: 'string' }],
			systemFields: [],
			relations: [],
		});
	}

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'd6s-ipush-'));
		home = mkdtempSync(join(tmpdir(), 'd6s-ihome-'));
		stderr = [];

		vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

		vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
			stderr.push(String(chunk));
			return true;
		});

		// Non-CI so credential resolution is allowed to consult the ambient token; the profile-specific
		// env var is the source resolveTarget reads without prompting.
		vi.stubEnv('HOME', home);
		vi.stubEnv('USERPROFILE', home);
		vi.stubEnv('CI', '');
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		vi.mocked(confirm).mockReset();
		vi.mocked(text).mockReset();
		vi.mocked(select).mockReset();
		vi.mocked(isCancel).mockReset().mockReturnValue(false);
		vi.mocked(fetchDiff).mockReset();
		vi.mocked(applyDiff).mockReset().mockResolvedValue(undefined);
		vi.mocked(fetchRecords).mockReset().mockResolvedValue([]);
		vi.mocked(importBatch).mockReset();

		seedProjectConfig(dir);
		seedSnapshot();
	});

	// A source→target data set seeded on disk so prepareDataPush has records to reconcile and import; the
	// source URL keys the committed ID map's bucket.
	const source = 'https://source.example.com';

	function seedData(collections: Parameters<typeof writeDataFiles>[1]): void {
		writeDataFiles(join(dir, 'directus', 'default', 'data'), collections, source);
	}

	function importResult(collections: ImportBatchResult['collections'] = {}): ImportBatchResult {
		return { applied: true, mode: 'merge', collections };
	}

	function readIdMap(): Record<string, unknown> {
		return JSON.parse(readFileSync(join(dir, 'directus', 'default', 'id_map.json'), 'utf8'));
	}

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
		rmSync(dir, { recursive: true, force: true });
		rmSync(home, { recursive: true, force: true });
	});

	it('applies once when the operator confirms the push', async () => {
		vi.mocked(fetchDiff).mockResolvedValueOnce(changesResult());
		vi.mocked(confirm).mockResolvedValueOnce(true);

		await push({ to: 'staging', mode: 'merge', project: 'default' }, ctxAt(dir));

		expect(applyDiff).toHaveBeenCalledTimes(1);
	});

	it('aborts without applying when the operator declines the confirmation', async () => {
		vi.mocked(fetchDiff).mockResolvedValueOnce(changesResult());
		vi.mocked(confirm).mockResolvedValueOnce(false);

		await expect(push({ to: 'staging', mode: 'merge', project: 'default' }, ctxAt(dir))).rejects.toThrow(
			/nothing was applied/i,
		);

		expect(applyDiff).not.toHaveBeenCalled();
	});

	it('still demands the typed confirmation for deletions even with --yes, then applies on an exact match', async () => {
		// The invariant in the interactive path: --yes skips the generic confirm but can never skip the
		// typed deletion confirmation. Typing the profile name exactly is the human consent that unlocks it.
		vi.mocked(fetchDiff).mockResolvedValueOnce(deletionResult());
		vi.mocked(text).mockResolvedValueOnce('staging');

		await push({ to: 'staging', mode: 'mirror', yes: true, project: 'default' }, ctxAt(dir));

		expect(confirm).not.toHaveBeenCalled();
		expect(text).toHaveBeenCalledTimes(1);
		expect(applyDiff).toHaveBeenCalledTimes(1);
	});

	it('aborts without applying when the typed deletion confirmation does not match', async () => {
		vi.mocked(fetchDiff).mockResolvedValueOnce(deletionResult());
		vi.mocked(text).mockResolvedValueOnce('nope');

		await expect(push({ to: 'staging', mode: 'mirror', yes: true, project: 'default' }, ctxAt(dir))).rejects.toThrow(
			/did not match/i,
		);

		expect(applyDiff).not.toHaveBeenCalled();
	});

	it('runs a dry-run import before the committing import in the interactive path', async () => {
		// The interactive data plan is REAL: a dry-run import (rolled back server-side) produces the plan the
		// operator approves, so it must run — and run before — the committing import. CI skips it (covered in
		// the wire suite, where the import is registered exactly once with no dryRun).
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);
		seedData([{ collection: 'articles', primaryKey: 'id', records: [{ id: 1, title: 'Hi' }] }]);
		vi.mocked(importBatch).mockResolvedValue(importResult());
		vi.mocked(confirm).mockResolvedValueOnce(true);

		await push({ to: 'staging', mode: 'merge', project: 'default' }, ctxAt(dir));

		expect(importBatch).toHaveBeenCalledTimes(2);
		expect(vi.mocked(importBatch).mock.calls[0]?.[2]).toMatchObject({ dryRun: true });
		expect(vi.mocked(importBatch).mock.calls[1]?.[2]).not.toHaveProperty('dryRun');
	});

	it('demands the typed confirmation for data deletions the dry-run surfaces, even with a clean schema', async () => {
		// Destruction on the table is not only schema: a mirror data plan that deletes rows triggers the
		// typed confirmation even when the schema is clean and even under --yes. No schema change means apply
		// never runs, proving the data plan alone drove the gate.
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);
		seedData([{ collection: 'articles', primaryKey: 'id', records: [{ id: 1, title: 'Hi' }] }]);

		vi.mocked(importBatch).mockResolvedValue(
			importResult({ articles: { existing: [], new: [], deleted: [9], mapped: {} } }),
		);

		vi.mocked(text).mockResolvedValueOnce('staging');

		await push({ to: 'staging', mode: 'mirror', yes: true, project: 'default' }, ctxAt(dir));

		expect(text).toHaveBeenCalledTimes(1);
		expect(applyDiff).not.toHaveBeenCalled();
		expect(importBatch).toHaveBeenCalledTimes(2);
	});

	it('persists an ambiguity choice into the committed map before importing', async () => {
		// Reconcile stops on an ambiguous match rather than guessing; the operator's pick is seeded into the
		// committed map immediately (identity facts survive even an aborted push) so a future reconcile skips
		// the now-settled record.
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);
		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);

		vi.mocked(fetchRecords).mockResolvedValueOnce([
			{ id: 't1', name: 'Editor' },
			{ id: 't2', name: 'Editor' },
		]);

		vi.mocked(select).mockResolvedValueOnce('target:t2');
		vi.mocked(importBatch).mockResolvedValue(importResult());
		vi.mocked(confirm).mockResolvedValueOnce(true);

		await push({ to: 'staging', mode: 'merge', project: 'default' }, ctxAt(dir));

		expect(select).toHaveBeenCalledTimes(1);

		expect(readIdMap()).toEqual({
			formatVersion: 1,
			maps: { [source]: { [url]: { directus_roles: { sr1: 't2' } } } },
		});
	});

	it('re-reconciles children after an ambiguity is resolved to an existing target', async () => {
		// While a parent is ambiguous, a child keyed through its FK is untranslatable and cannot match. The
		// operator's answer supplies the missing mapping, so reconcile must run again: the child then UPDATES
		// the target's own child row instead of inserting a look-alike duplicate beside it. The answer is
		// never asked twice, and the second pass reuses the fetched records rather than re-fetching.
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);

		seedData([
			{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] },
			{
				collection: 'directus_access',
				primaryKey: 'id',
				records: [{ id: 'sa1', role: 'sr1', user: null, policy: null }],
			},
		]);

		// Reconcile fetches parents first (reversed dependency order): roles, then access.
		vi.mocked(fetchRecords)
			.mockResolvedValueOnce([
				{ id: 't1', name: 'Editor' },
				{ id: 't2', name: 'Editor' },
			])
			.mockResolvedValueOnce([{ id: 'ta2', role: 't2', user: null, policy: null }]);

		vi.mocked(select).mockResolvedValueOnce('target:t2');
		vi.mocked(importBatch).mockResolvedValue(importResult());
		vi.mocked(confirm).mockResolvedValueOnce(true);

		await push({ to: 'staging', mode: 'merge', project: 'default' }, ctxAt(dir));

		expect(select).toHaveBeenCalledTimes(1);
		expect(fetchRecords).toHaveBeenCalledTimes(2);

		// Both identities land in the committed map: the answered parent AND the child the answer unlocked.
		expect(readIdMap()).toEqual({
			formatVersion: 1,
			maps: { [source]: { [url]: { directus_access: { sa1: 'ta2' }, directus_roles: { sr1: 't2' } } } },
		});

		// The committing import carries the child rewritten fully into target space — an update of ta2.
		const batch = vi.mocked(importBatch).mock.calls.at(-1)?.[1];
		const access = batch?.find((entry) => entry.collection === 'directus_access');

		expect(access?.items).toEqual([{ id: 'ta2', role: 't2', user: null, policy: null }]);
	});

	it('asks once and cascades nothing when an ambiguity is answered with create', async () => {
		// 'create' adds no mapping, so a second reconcile pass could translate nothing new — it must not run,
		// and above all it must not re-ask the question it already had answered. The child keeps its
		// source-space FK for the server to link against the parent inserted in the same batch.
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);

		seedData([
			{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] },
			{
				collection: 'directus_access',
				primaryKey: 'id',
				records: [{ id: 'sa1', role: 'sr1', user: null, policy: null }],
			},
		]);

		vi.mocked(fetchRecords)
			.mockResolvedValueOnce([
				{ id: 't1', name: 'Editor' },
				{ id: 't2', name: 'Editor' },
			])
			.mockResolvedValueOnce([]);

		vi.mocked(select).mockResolvedValueOnce('create');
		vi.mocked(importBatch).mockResolvedValue(importResult());
		vi.mocked(confirm).mockResolvedValueOnce(true);

		await push({ to: 'staging', mode: 'merge', project: 'default' }, ctxAt(dir));

		expect(select).toHaveBeenCalledTimes(1);

		const batch = vi.mocked(importBatch).mock.calls.at(-1)?.[1];
		const access = batch?.find((entry) => entry.collection === 'directus_access');

		expect(access?.items).toEqual([{ id: 'sa1', role: 'sr1', user: null, policy: null }]);

		// The post-import map update records only the identity facts of what was sent — no cross-mapping to
		// t1 or t2 exists, because 'create' answered that neither is this record.
		expect(readIdMap()).toEqual({
			formatVersion: 1,
			maps: { [source]: { [url]: { directus_access: { sa1: 'sa1' }, directus_roles: { sr1: 'sr1' } } } },
		});
	});

	it('states an all-zero data plan plainly instead of a contradictory header', async () => {
		// A changed schema with a no-op data dry-run must not render "data changes to import" over a
		// "no data changes" line — the header appears only when the plan contains any.
		vi.mocked(fetchDiff).mockResolvedValueOnce(changesResult());
		seedData([{ collection: 'articles', primaryKey: 'id', records: [{ id: 1, title: 'Hi' }] }]);
		vi.mocked(importBatch).mockResolvedValue(importResult());
		vi.mocked(confirm).mockResolvedValueOnce(true);

		await push({ to: 'staging', mode: 'merge', project: 'default' }, ctxAt(dir));

		const output = stderr.join('');

		expect(output).toContain('no data changes to import.');
		expect(output).not.toContain('data changes to import to');
	});

	it('aborts the push and touches neither apply nor import when the operator aborts an ambiguity', async () => {
		// Choosing abort at an ambiguity stops the push before any mutation — the reconcile refusal is a hard
		// stop, not a skip.
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);
		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);

		vi.mocked(fetchRecords).mockResolvedValueOnce([
			{ id: 't1', name: 'Editor' },
			{ id: 't2', name: 'Editor' },
		]);

		vi.mocked(select).mockResolvedValueOnce('abort');

		await expect(push({ to: 'staging', mode: 'merge', project: 'default' }, ctxAt(dir))).rejects.toThrow(/abort/i);

		expect(importBatch).not.toHaveBeenCalled();
		expect(applyDiff).not.toHaveBeenCalled();
	});
});
