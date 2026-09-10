import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { confirm, isCancel, note, select, text } from '@clack/prompts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createConfigStore } from '../../kernel/config/file.js';
import type { CliContext } from '../../kernel/run.js';
import { createUi } from '../../kernel/ui.js';
import { push } from './push.js';
import { fullSnapshot, seedProjectConfig, SYNC_TOKEN, SYNC_URL } from './sync.test-support.js';
import { applyDiff, fetchDiff, fetchRecords, importBatch } from './utils/api.js';
import type { DiffResult, ImportBatchResult } from './utils/contract.js';
import { writeDataFiles } from './utils/data-store.js';
import { writeSnapshotFiles } from './utils/store.js';

vi.mock('@clack/prompts', () => ({
	confirm: vi.fn(),
	text: vi.fn(),
	note: vi.fn(),
	select: vi.fn(),
	isCancel: vi.fn(() => false),
}));

vi.mock('./utils/api.js', () => ({
	fetchDiff: vi.fn(),
	applyDiff: vi.fn(),
	fetchRecords: vi.fn(),
	importBatch: vi.fn(),
}));

const url = SYNC_URL;
const token = SYNC_TOKEN;

function ctxAt(cwd: string): CliContext {
	return { cwd, config: createConfigStore(cwd), interactive: true, ui: createUi({ json: false, color: false }) };
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
		writeSnapshotFiles(join(dir, 'directus', 'default', 'schema'), fullSnapshot());
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

		vi.stubEnv('HOME', home);
		vi.stubEnv('USERPROFILE', home);
		vi.stubEnv('CI', '');
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		vi.mocked(confirm).mockReset();
		vi.mocked(text).mockReset();
		vi.mocked(note).mockReset();
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
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);
		seedData([{ collection: 'directus_flows', primaryKey: 'id', records: [{ id: 'f1', name: 'Deploy' }] }]);
		vi.mocked(importBatch).mockResolvedValue(importResult());
		vi.mocked(confirm).mockResolvedValueOnce(true);

		await push({ to: 'staging', mode: 'merge', project: 'default' }, ctxAt(dir));

		expect(importBatch).toHaveBeenCalledTimes(2);
		expect(vi.mocked(importBatch).mock.calls[0]?.[2]).toMatchObject({ dryRun: true });
		expect(vi.mocked(importBatch).mock.calls[1]?.[2]).not.toHaveProperty('dryRun');
	});

	it('demands the typed confirmation for data deletions the dry-run surfaces, even with a clean schema', async () => {
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);
		seedData([{ collection: 'directus_flows', primaryKey: 'id', records: [{ id: 'f1', name: 'Deploy' }] }]);

		vi.mocked(importBatch).mockResolvedValue(
			importResult({ directus_flows: { existing: [], new: [], deleted: [9], mapped: {} } }),
		);

		vi.mocked(text).mockResolvedValueOnce('staging');

		await push({ to: 'staging', mode: 'mirror', yes: true, project: 'default' }, ctxAt(dir));

		expect(text).toHaveBeenCalledTimes(1);
		expect(applyDiff).not.toHaveBeenCalled();
		expect(importBatch).toHaveBeenCalledTimes(2);
	});

	it('imports an all-empty mirror batch instead of calling it converged — emptiness IS the deletion', async () => {
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);
		seedData([{ collection: 'directus_flows', primaryKey: 'id', records: [] }]);

		vi.mocked(importBatch).mockResolvedValue(
			importResult({ directus_flows: { existing: [], new: [], deleted: [1, 2], mapped: {} } }),
		);

		vi.mocked(text).mockResolvedValueOnce('staging');

		await push({ to: 'staging', mode: 'mirror', yes: true, project: 'default' }, ctxAt(dir));

		expect(text).toHaveBeenCalledTimes(1);
		expect(importBatch).toHaveBeenCalledTimes(2);
		expect(vi.mocked(importBatch).mock.calls[1]?.[1]).toEqual([{ collection: 'directus_flows', items: [] }]);
	});

	it('short-circuits the same all-empty batch under merge — without the delete semantics it is a no-op', async () => {
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);
		seedData([{ collection: 'directus_flows', primaryKey: 'id', records: [] }]);

		await push({ to: 'staging', mode: 'merge', project: 'default' }, ctxAt(dir));

		expect(importBatch).not.toHaveBeenCalled();
		expect(confirm).not.toHaveBeenCalled();
	});

	it('persists an ambiguity choice into the ID map before pushing', async () => {
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

		expect(select).toHaveBeenCalledWith(
			expect.objectContaining({
				message: 'Which target role does this represent?',
				options: [
					{
						value: 'target:t1',
						label: 'Existing target role "Editor" — t1',
						hint: 'Same synced values; only the ID differs',
					},
					{
						value: 'target:t2',
						label: 'Existing target role "Editor" — t2',
						hint: 'Same synced values; only the ID differs',
					},
					{
						value: 'create',
						label: 'No existing role — create a new one on the target',
						hint: 'Creates another "Editor" role',
					},
					{ value: 'abort', label: 'Abort push', hint: 'Applies no remote changes' },
				],
			}),
		);

		expect(readIdMap()).toEqual({
			formatVersion: 1,
			maps: { [source]: { [url]: { directus_roles: { sr1: 't2' } } } },
		});
	});

	it('withholds a target already claimed by an earlier ambiguity answer in the same pass', async () => {
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

	it('explains when two local policies compete for one target and why the second cannot reuse it', async () => {
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);

		seedData([
			{
				collection: 'directus_policies',
				primaryKey: 'id',
				records: [
					{ id: 'sp1', name: 'Administrator', description: 'Local one' },
					{ id: 'sp2', name: 'Administrator', description: 'Local two' },
				],
			},
		]);

		vi.mocked(fetchRecords).mockResolvedValueOnce([{ id: 'tp1', name: 'Administrator', description: 'Target' }]);

		vi.mocked(select).mockResolvedValueOnce('target:tp1').mockResolvedValueOnce('create');
		vi.mocked(importBatch).mockResolvedValue(importResult());
		vi.mocked(confirm).mockResolvedValueOnce(true);

		await push({ to: 'staging', mode: 'merge', project: 'default' }, ctxAt(dir));

		expect(note).toHaveBeenNthCalledWith(
			1,
			[
				'./directus/default contains 2 policies named "Administrator".',
				'staging — https://cms.example.com contains 1 matching policy.',
				'',
				'Policy: "Administrator" — sp1',
				'Source UI: https://source.example.com/admin/settings/policies/sp1',
				'Target UI: https://cms.example.com/admin/settings/policies/tp1',
			].join('\n'),
			'directus_policies — 1 of 2',
		);

		expect(select).toHaveBeenNthCalledWith(1, {
			message: 'Which target policy does this represent?',
			options: [
				{
					value: 'target:tp1',
					label: 'Existing target policy "Administrator" — tp1',
					hint: 'Merge updates the target; description: local "Local one", target "Target"',
				},
				{
					value: 'create',
					label: 'No existing policy — create a new one on the target',
					hint: 'Creates another "Administrator" policy',
				},
				{ value: 'abort', label: 'Abort push', hint: 'Applies no remote changes' },
			],
		});

		expect(note).toHaveBeenNthCalledWith(
			2,
			[
				'./directus/default contains 2 policies named "Administrator".',
				'staging — https://cms.example.com contains 1 matching policy.',
				'',
				'Policy: "Administrator" — sp2',
				'Source UI: https://source.example.com/admin/settings/policies/sp2',
				'',
				'The only matching target policy "Administrator" — tp1 was already matched to',
				'"Administrator" — sp1 earlier in this push.',
				'Target UI: https://cms.example.com/admin/settings/policies/tp1',
			].join('\n'),
			'directus_policies — 2 of 2',
		);

		expect(select).toHaveBeenNthCalledWith(2, {
			message: 'Which target policy does this represent?',
			options: [
				{
					value: 'create',
					label: 'No existing policy — create a new one on the target',
					hint: 'Creates another "Administrator" policy',
				},
				{ value: 'abort', label: 'Abort push', hint: 'Applies no remote changes' },
			],
		});

		expect(note).toHaveBeenNthCalledWith(
			3,
			[
				'directus_policies "Administrator" — sp1 → existing target "Administrator" — tp1',
				'directus_policies "Administrator" — sp2 → new target policy',
			].join('\n'),
			'Identity choices',
		);
	});

	it('warns that creating during mirror can still delete unmatched target records', async () => {
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);
		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);

		vi.mocked(fetchRecords).mockResolvedValueOnce([
			{ id: 't1', name: 'Editor' },
			{ id: 't2', name: 'Editor' },
		]);

		vi.mocked(select).mockResolvedValueOnce('abort');

		await expect(push({ to: 'staging', mode: 'mirror', project: 'default' }, ctxAt(dir))).rejects.toThrow(/abort/i);

		expect(select).toHaveBeenCalledWith(
			expect.objectContaining({
				options: expect.arrayContaining([
					{
						value: 'create',
						label: 'No existing role — create a new one on the target',
						hint: 'Creates another "Editor" role; unmatched target records may be deleted',
					},
				]),
			}),
		);
	});

	it('re-reconciles children after an ambiguity is resolved to an existing target', async () => {
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

	it("echoes the target's user-attached grants AND their target-only policies with rules into a mirror batch", async () => {
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);

		seedData([
			{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] },
			{ collection: 'directus_policies', primaryKey: 'id', records: [{ id: 'sp1', name: 'Editor Policy' }] },
			{
				collection: 'directus_access',
				primaryKey: 'id',
				records: [{ id: 'sa1', role: 'sr1', user: null, policy: 'sp1' }],
			},
			{
				collection: 'directus_permissions',
				primaryKey: 'id',
				records: [{ id: 4, policy: 'sp1', collection: 'articles', action: 'read' }],
			},
		]);

		// A policy attached directly to a target user, with its own permission rule — neither is in local files.
		const targetsByEndpoint: Record<string, Record<string, unknown>[]> = {
			'/roles': [{ id: 't1', name: 'Editor' }],
			'/policies': [{ id: 'tp-user', name: 'Local Ops' }],
			'/access': [{ id: 'ta-user', role: null, user: 'u9', policy: 'tp-user' }],
			'/permissions': [{ id: 9, policy: 'tp-user', collection: 'articles', action: 'update' }],
		};

		vi.mocked(fetchRecords).mockImplementation(async (_credential, source) => targetsByEndpoint[source.endpoint] ?? []);

		vi.mocked(importBatch).mockResolvedValue(
			importResult({
				directus_permissions: { existing: [9], new: [31], deleted: [], mapped: { '-1': 31 } },
			}),
		);

		vi.mocked(confirm).mockResolvedValueOnce(true);

		await push({ to: 'staging', mode: 'mirror', project: 'default' }, ctxAt(dir));

		const batch = vi.mocked(importBatch).mock.calls.at(-1)?.[1];
		const byCollection = (name: string) => batch?.find((entry) => entry.collection === name)?.items;

		expect(byCollection('directus_access')).toEqual([
			{ id: 'sa1', role: 't1', user: null, policy: 'sp1' },
			{ id: 'ta-user', role: null, user: 'u9', policy: 'tp-user' },
		]);

		// The policy deletion pass would cascade the preserved grant away without this echo.
		expect(byCollection('directus_policies')).toEqual([
			{ id: 'sp1', name: 'Editor Policy' },
			{ id: 'tp-user', name: 'Local Ops' },
		]);

		// And the permissions pass would strip the echoed policy of its rules.
		expect(byCollection('directus_permissions')).toEqual([
			{ id: -1, policy: 'sp1', collection: 'articles', action: 'read' },
			{ id: 9, policy: 'tp-user', collection: 'articles', action: 'update' },
		]);
	});

	it('does not echo a policy the sync files already keep — the mapped record is its keep entry', async () => {
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);

		seedData([
			{ collection: 'directus_policies', primaryKey: 'id', records: [{ id: 'sp1', name: 'Editor Policy' }] },
			{ collection: 'directus_access', primaryKey: 'id', records: [] },
		]);

		writeFileSync(
			join(dir, 'directus', 'default', 'id_map.json'),
			`${JSON.stringify({ formatVersion: 1, maps: { [source]: { [url]: { directus_policies: { sp1: 'tp1' } } } } })}\n`,
		);

		const targetsByEndpoint: Record<string, Record<string, unknown>[]> = {
			'/policies': [{ id: 'tp1', name: 'Editor Policy' }],
			'/access': [{ id: 'ta-user', role: null, user: 'u9', policy: 'tp1' }],
			'/permissions': [],
		};

		vi.mocked(fetchRecords).mockImplementation(async (_credential, source) => targetsByEndpoint[source.endpoint] ?? []);

		vi.mocked(importBatch).mockResolvedValue(importResult());
		vi.mocked(confirm).mockResolvedValueOnce(true);

		await push({ to: 'staging', mode: 'mirror', project: 'default' }, ctxAt(dir));

		const batch = vi.mocked(importBatch).mock.calls.at(-1)?.[1];
		const policies = batch?.find((entry) => entry.collection === 'directus_policies');

		expect(policies?.items).toEqual([{ id: 'tp1', name: 'Editor Policy' }]);
	});

	it('uses a temporary numeric PK instead of overwriting an unrelated target record', async () => {
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);

		seedData([
			{
				collection: 'directus_permissions',
				primaryKey: 'id',
				records: [{ id: 7, policy: null, collection: 'articles', action: 'read' }],
			},
		]);

		vi.mocked(fetchRecords).mockResolvedValueOnce([{ id: 7, policy: null, collection: 'articles', action: 'update' }]);

		vi.mocked(importBatch).mockResolvedValue(
			importResult({
				directus_permissions: { existing: [], new: [27], deleted: [], mapped: { '-1': 27 } },
			}),
		);

		vi.mocked(confirm).mockResolvedValueOnce(true);

		await push({ to: 'staging', mode: 'merge', project: 'default' }, ctxAt(dir));

		const batch = vi.mocked(importBatch).mock.calls.at(-1)?.[1];
		const permissions = batch?.find((entry) => entry.collection === 'directus_permissions');

		expect(permissions?.items).toEqual([{ id: -1, policy: null, collection: 'articles', action: 'read' }]);

		expect(readIdMap()).toEqual({
			formatVersion: 1,
			maps: { [source]: { [url]: { directus_permissions: { '7': '27' } } } },
		});
	});

	it('refuses before applying when the dry run matches a temporary key to a target record hidden from list reads', async () => {
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);

		seedData([
			{
				collection: 'directus_permissions',
				primaryKey: 'id',
				records: [{ id: 7, policy: null, collection: 'articles', action: 'read' }],
			},
		]);

		// The target list read returns nothing, so the allocator picks -1 — but the dry run reports that key
		// as an existing record: a row the target's API hides from lists but the import still matches by key.
		vi.mocked(importBatch).mockResolvedValue(
			importResult({ directus_permissions: { existing: [-1], new: [], deleted: [], mapped: {} } }),
		);

		await expect(push({ to: 'staging', mode: 'merge', project: 'default' }, ctxAt(dir))).rejects.toThrow(
			/temporary key -1 is already a target record/,
		);

		expect(importBatch).toHaveBeenCalledTimes(1);
		expect(vi.mocked(importBatch).mock.calls[0]?.[2]).toMatchObject({ dryRun: true });
		expect(confirm).not.toHaveBeenCalled();
		expect(existsSync(join(dir, 'directus', 'default', 'id_map.json'))).toBe(false);
	});

	it('sends only unmapped records under add mode, so a repeat add cannot mint duplicates', async () => {
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
		vi.mocked(fetchDiff).mockResolvedValueOnce(changesResult());
		seedData([{ collection: 'directus_flows', primaryKey: 'id', records: [{ id: 'f1', name: 'Deploy' }] }]);
		vi.mocked(importBatch).mockResolvedValue(importResult());
		vi.mocked(confirm).mockResolvedValueOnce(true);

		await push({ to: 'staging', mode: 'merge', project: 'default' }, ctxAt(dir));

		const output = stderr.join('');

		expect(output).toContain('Configuration — no changes to push.');
		expect(output).not.toMatch(/Configuration — \d+ changes?:/);
	});

	it('aborts the push and touches neither apply nor import when the operator aborts an ambiguity', async () => {
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
