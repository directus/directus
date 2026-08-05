import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { confirm, isCancel, select, text } from '@clack/prompts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createConfigStore } from '../../kernel/config/file.js';
import type { CliContext } from '../../kernel/run.js';
import { createUi } from '../../kernel/ui.js';
import { diff } from './diff.js';
import { fullSnapshot, seedProjectConfig, SYNC_TOKEN } from './sync.test-support.js';
import { fetchDiff, fetchRecords, importBatch } from './utils/api.js';
import type { DiffResult, ImportBatchResult } from './utils/contract.js';
import { writeDataFiles } from './utils/data-store.js';
import { writeSnapshotFiles } from './utils/store.js';

vi.mock('@clack/prompts', () => ({
	confirm: vi.fn(),
	text: vi.fn(),
	select: vi.fn(),
	isCancel: vi.fn(() => false),
}));

vi.mock('./utils/api.js', () => ({
	fetchDiff: vi.fn(),
	applyDiff: vi.fn(),
	fetchRecords: vi.fn(),
	importBatch: vi.fn(),
}));

const token = SYNC_TOKEN;
const source = 'https://source.example.com';

function ctxAt(cwd: string): CliContext {
	return { cwd, config: createConfigStore(cwd), interactive: true, ui: createUi({ json: false, color: false }) };
}

describe('interactive sync diff', () => {
	let dir: string;
	let home: string;
	let stderr: string[];

	function seedSnapshot(): void {
		writeSnapshotFiles(join(dir, 'directus', 'default', 'schema'), fullSnapshot());
	}

	function seedData(collections: Parameters<typeof writeDataFiles>[1]): void {
		writeDataFiles(join(dir, 'directus', 'default', 'data'), collections, source);
	}

	function importResult(collections: ImportBatchResult['collections'] = {}): ImportBatchResult {
		return { applied: false, mode: 'merge', collections };
	}

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'd6s-idiff-'));
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
		vi.mocked(select).mockReset();
		vi.mocked(isCancel).mockReset().mockReturnValue(false);
		vi.mocked(fetchDiff).mockReset().mockResolvedValue(null);
		vi.mocked(fetchRecords).mockReset().mockResolvedValue([]);
		vi.mocked(importBatch).mockReset();

		seedProjectConfig(dir);
		seedSnapshot();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
		rmSync(dir, { recursive: true, force: true });
		rmSync(home, { recursive: true, force: true });
	});

	it('reports an ambiguity as unresolved without prompting, creating, or calling it "nothing to do"', async () => {
		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);

		vi.mocked(fetchRecords).mockResolvedValueOnce([
			{ id: 't1', name: 'Editor' },
			{ id: 't2', name: 'Editor' },
		]);

		await diff({ to: 'staging', project: 'default' }, ctxAt(dir));

		expect(select).not.toHaveBeenCalled();
		expect(confirm).not.toHaveBeenCalled();
		expect(text).not.toHaveBeenCalled();
		expect(importBatch).not.toHaveBeenCalled();

		const output = stderr.join('');

		expect(output).toContain('Configuration — no changes to push; 1 record unresolved.');
		expect(output).toContain('has no target match yet');
		expect(output).toContain('1 ambiguous');
		expect(output).toContain('a non-interactive push refuses until they are resolved');
		expect(output).not.toContain('matches the commit-ready files');

		expect(existsSync(join(dir, 'directus', 'default', 'id_map.json'))).toBe(false);
	});

	it('states an all-zero data plan plainly instead of a contradictory header', async () => {
		const schemaChange: DiffResult = {
			hash: 'h1',
			diff: {
				collections: [{ collection: 'events', diff: [{ kind: 'N', rhs: { collection: 'events' } }] }],
				fields: [],
				systemFields: [],
				relations: [],
			},
		};

		vi.mocked(fetchDiff).mockResolvedValueOnce(schemaChange);
		seedData([{ collection: 'directus_flows', primaryKey: 'id', records: [{ id: 'f1', name: 'Deploy' }] }]);
		vi.mocked(importBatch).mockResolvedValue(importResult());

		await diff({ to: 'staging', project: 'default' }, ctxAt(dir));

		const output = stderr.join('');

		expect(output).toContain('Configuration — no changes to push.');
		expect(output).not.toContain('changes a push would import');
	});

	it('dry-runs an all-empty mirror batch instead of calling it a match — emptiness IS the deletion', async () => {
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);
		seedData([{ collection: 'directus_flows', primaryKey: 'id', records: [] }]);

		vi.mocked(importBatch).mockResolvedValue(
			importResult({ directus_flows: { existing: [], new: [], deleted: [1, 2], mapped: {} } }),
		);

		await diff({ to: 'staging', mode: 'mirror', project: 'default' }, ctxAt(dir));

		expect(importBatch).toHaveBeenCalledTimes(1);
		expect(vi.mocked(importBatch).mock.calls[0]?.[2]).toMatchObject({ dryRun: true });

		expect(stderr.join('')).toContain('Configuration — 2 changes: 0 created, 0 updated, 2 deleted');
		expect(stderr.join('')).not.toContain('matches the commit-ready files');
	});
});
