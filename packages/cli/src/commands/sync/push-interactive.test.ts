import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

// Script prompts and isolate interactive gates/reconciliation from the network.
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

		// Interactive resolution still authenticates through the profile-specific environment variable.
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
		// The approved plan must come from a rolled-back server import before the committing import.
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

	it('imports an all-empty mirror batch instead of calling it converged — emptiness IS the deletion', async () => {
		// Under mirror, { collection, items: [] } instructs the server to delete EVERY target row in that
		// collection, so a committed-but-empty collection is the opposite of a no-op. The converged
		// short-circuit (records === 0) must never swallow it: the dry-run runs and names the doomed rows,
		// the typed gate fires, and the committing import carries the empty entry to the server.
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);
		seedData([{ collection: 'articles', primaryKey: 'id', records: [] }]);

		vi.mocked(importBatch).mockResolvedValue(
			importResult({ articles: { existing: [], new: [], deleted: [1, 2], mapped: {} } }),
		);

		vi.mocked(text).mockResolvedValueOnce('staging');

		await push({ to: 'staging', mode: 'mirror', yes: true, project: 'default' }, ctxAt(dir));

		expect(text).toHaveBeenCalledTimes(1);
		expect(importBatch).toHaveBeenCalledTimes(2);
		expect(vi.mocked(importBatch).mock.calls[1]?.[1]).toEqual([{ collection: 'articles', items: [] }]);
	});

	it('short-circuits the same all-empty batch under merge — without the delete semantics it is a no-op', async () => {
		// The converged exit stays correct for merge: an empty batch entry imports nothing and deletes
		// nothing, so no import (not even a dry-run) should touch the wire.
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);
		seedData([{ collection: 'articles', primaryKey: 'id', records: [] }]);

		await push({ to: 'staging', mode: 'merge', project: 'default' }, ctxAt(dir));

		expect(importBatch).not.toHaveBeenCalled();
		expect(confirm).not.toHaveBeenCalled();
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

	it('withholds a target already claimed by an earlier ambiguity answer in the same pass', async () => {
		// Two sources sharing a natural key are offered the same candidate list; if both could claim one
		// target, two sources would bind to a single row and every later push would have them overwriting
		// each other on it (last write wins). The second prompt must not offer what the first answer took.
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);

		seedData([
			{
				collection: 'directus_roles',
				primaryKey: 'id',
				records: [
					{ id: 'sr1', name: 'Editor' },
					{ id: 'sr2', name: 'Editor' },
				],
			},
		]);

		vi.mocked(fetchRecords).mockResolvedValueOnce([
			{ id: 't1', name: 'Editor' },
			{ id: 't2', name: 'Editor' },
		]);

		vi.mocked(select).mockResolvedValueOnce('target:t1').mockResolvedValueOnce('target:t2');
		vi.mocked(importBatch).mockResolvedValue(importResult());
		vi.mocked(confirm).mockResolvedValue(true);

		await push({ to: 'staging', mode: 'merge', project: 'default' }, ctxAt(dir));

		expect(select).toHaveBeenCalledTimes(2);

		const optionValues = (call: number): string[] => {
			const options = vi.mocked(select).mock.calls[call]?.[0]?.options as { value: string }[];
			return options.map((option) => option.value);
		};

		expect(optionValues(0)).toEqual(['target:t1', 'target:t2', 'create', 'abort']);
		expect(optionValues(1)).toEqual(['target:t2', 'create', 'abort']);

		expect(readIdMap()).toEqual({
			formatVersion: 1,
			maps: { [source]: { [url]: { directus_roles: { sr1: 't1', sr2: 't2' } } } },
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
				records: [{ id: 'sa1', role: 'sr1', user: null, policy: null, sort: 1 }],
			},
		]);

		vi.mocked(fetchRecords)
			.mockResolvedValueOnce([
				{ id: 't1', name: 'Editor' },
				{ id: 't2', name: 'Editor' },
			])
			.mockResolvedValueOnce([{ id: 'ta2', role: 't2', user: null, policy: null, sort: 2 }]);

		vi.mocked(select).mockResolvedValueOnce('target:t2');
		vi.mocked(importBatch).mockResolvedValue(importResult());
		vi.mocked(confirm).mockResolvedValueOnce(true);

		await push({ to: 'staging', mode: 'merge', project: 'default' }, ctxAt(dir));

		expect(select).toHaveBeenCalledTimes(1);
		expect(fetchRecords).toHaveBeenCalledTimes(2);

		expect(readIdMap()).toEqual({
			formatVersion: 1,
			maps: { [source]: { [url]: { directus_access: { sa1: 'ta2' }, directus_roles: { sr1: 't2' } } } },
		});

		const batch = vi.mocked(importBatch).mock.calls.at(-1)?.[1];
		const access = batch?.find((entry) => entry.collection === 'directus_access');

		expect(access?.items).toEqual([{ id: 'ta2', role: 't2', user: null, policy: null, sort: 1 }]);
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

		expect(readIdMap()).toEqual({
			formatVersion: 1,
			maps: { [source]: { [url]: { directus_access: { sa1: 'sa1' }, directus_roles: { sr1: 'sr1' } } } },
		});
	});

	it("echoes the target's user-attached access rows into a mirror batch so they survive the delete", async () => {
		// The server's mirror delete removes every target row absent from the batch, and pull deliberately
		// exports only null-user access grants — so without the echo, a mirror push would destroy every user
		// grant on the target (the directus-sync #148 data-loss class). The target's own user rows ride along
		// verbatim, upsert onto themselves, and survive.
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
			.mockResolvedValueOnce([{ id: 't1', name: 'Editor' }])
			.mockResolvedValueOnce([{ id: 'ta-user', role: 't1', user: 'u9', policy: null }]);

		vi.mocked(importBatch).mockResolvedValue(importResult());
		vi.mocked(confirm).mockResolvedValueOnce(true);

		await push({ to: 'staging', mode: 'mirror', project: 'default' }, ctxAt(dir));

		const batch = vi.mocked(importBatch).mock.calls.at(-1)?.[1];
		const access = batch?.find((entry) => entry.collection === 'directus_access');

		expect(access?.items).toEqual([
			{ id: 'sa1', role: 't1', user: null, policy: null },
			{ id: 'ta-user', role: 't1', user: 'u9', policy: null },
		]);
	});

	it('withholds an occupied numeric PK instead of overwriting the unrelated target row', async () => {
		// The server's merge treats an occupied PK as "the same record" — for autoincrement ids that is zero
		// identity evidence, and sending id 7 would silently replace an unrelated permission. The guard sends
		// the record without its PK (the server inserts fresh) and records NO map entry: the response cannot
		// report the assigned id, and a wrong entry would bind the source to the wrong row forever. The next
		// push reconciles the created row by natural key.
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);

		seedData([
			{
				collection: 'directus_permissions',
				primaryKey: 'id',
				records: [{ id: 7, policy: null, collection: 'articles', action: 'read' }],
			},
		]);

		vi.mocked(fetchRecords).mockResolvedValueOnce([{ id: 7, policy: null, collection: 'articles', action: 'update' }]);

		vi.mocked(importBatch).mockResolvedValue(importResult());
		vi.mocked(confirm).mockResolvedValueOnce(true);

		await push({ to: 'staging', mode: 'merge', project: 'default' }, ctxAt(dir));

		const batch = vi.mocked(importBatch).mock.calls.at(-1)?.[1];
		const permissions = batch?.find((entry) => entry.collection === 'directus_permissions');

		expect(permissions?.items).toEqual([{ policy: null, collection: 'articles', action: 'read' }]);
		expect(readIdMap()).toEqual({ formatVersion: 1, maps: {} });
	});

	it('sends only unmapped records under add mode, so a repeat add cannot mint duplicates', async () => {
		// The server's add path inserts unconditionally — an occupied uuid is regenerated — so re-sending a
		// record that is already mapped to a target row would create another copy on every run and chase the
		// map to the newest duplicate. "add (only new records)" means exactly the unmapped ones.
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);

		seedData([
			{
				collection: 'directus_roles',
				primaryKey: 'id',
				records: [
					{ id: 'sr1', name: 'Editor' },
					{ id: 'sr2', name: 'Writer' },
				],
			},
		]);

		writeFileSync(
			join(dir, 'directus', 'default', 'id_map.json'),
			`${JSON.stringify({ formatVersion: 1, maps: { [source]: { [url]: { directus_roles: { sr1: 't1' } } } } })}\n`,
		);

		vi.mocked(fetchRecords).mockResolvedValueOnce([{ id: 't1', name: 'Editor' }]);
		vi.mocked(importBatch).mockResolvedValue(importResult());
		vi.mocked(confirm).mockResolvedValueOnce(true);

		await push({ to: 'staging', mode: 'add', project: 'default' }, ctxAt(dir));

		const batch = vi.mocked(importBatch).mock.calls.at(-1)?.[1];
		const roles = batch?.find((entry) => entry.collection === 'directus_roles');

		expect(roles?.items).toEqual([{ id: 'sr2', name: 'Writer' }]);
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

		expect(output).toContain('Data — no changes to import.');
		expect(output).not.toContain('Data — changes to import:');
	});

	it('aborts the push and touches neither apply nor import when the operator aborts an ambiguity', async () => {
		// Aborting identity resolution must stop before any remote mutation.
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
