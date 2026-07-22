import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { confirm, isCancel, select, text } from '@clack/prompts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CliContext } from '../../kernel/run.js';
import { createUi } from '../../kernel/ui.js';
import { fetchDiff, fetchRecords, importBatch } from '../../sync/api.js';
import type { DiffResult, ImportBatchResult } from '../../sync/contract.js';
import { writeDataFiles } from '../../sync/data-store.js';
import { writeSnapshotFiles } from '../../sync/store.js';
import { diff } from './diff.js';
import { seedProjectConfig, SYNC_TOKEN } from './sync.test-support.js';

// Prompts are mocked to prove diff reports ambiguities instead of resolving them interactively.
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

const token = SYNC_TOKEN;
const source = 'https://source.example.com';

function ctxAt(cwd: string): CliContext {
	return { cwd, configPath: undefined, interactive: true, ui: createUi({ json: false, color: false }) };
}

describe('interactive sync diff', () => {
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

		// Interactive resolution still authenticates through the profile-specific environment variable.
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

	it('reports an ambiguity as a note and never prompts, dry-runs once, and writes no id map', async () => {
		// The read-only guarantee proven in the interactive path: two target roles named Editor make the
		// source ambiguous, yet diff resolves nothing interactively — no select/confirm/text — and instead
		// renders the reconcile note, dry-runs exactly once, and leaves the id map unwritten.
		seedData([{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'sr1', name: 'Editor' }] }]);

		vi.mocked(fetchRecords).mockResolvedValueOnce([
			{ id: 't1', name: 'Editor' },
			{ id: 't2', name: 'Editor' },
		]);

		vi.mocked(importBatch).mockResolvedValue(
			importResult({ directus_roles: { existing: [], new: ['sr1'], deleted: [], mapped: {} } }),
		);

		await diff({ to: 'staging', project: 'default' }, ctxAt(dir));

		expect(select).not.toHaveBeenCalled();
		expect(confirm).not.toHaveBeenCalled();
		expect(text).not.toHaveBeenCalled();

		expect(importBatch).toHaveBeenCalledTimes(1);
		expect(vi.mocked(importBatch).mock.calls[0]?.[2]).toMatchObject({ dryRun: true });

		expect(stderr.join('')).toContain('have no target match yet');
		expect(existsSync(join(dir, 'directus', 'default', 'id_map.json'))).toBe(false);
	});

	it('states an all-zero data plan plainly instead of a contradictory header', async () => {
		// A changed schema with a no-op data dry-run must not render "data changes to import" over a
		// "no data changes" line — the header appears only when the plan contains any.
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
		seedData([{ collection: 'articles', primaryKey: 'id', records: [{ id: 1, title: 'Hi' }] }]);
		vi.mocked(importBatch).mockResolvedValue(importResult());

		await diff({ to: 'staging', project: 'default' }, ctxAt(dir));

		const output = stderr.join('');

		expect(output).toContain('no data changes to import.');
		expect(output).not.toContain('data changes to import to');
	});

	it('dry-runs an all-empty mirror batch instead of calling it a match — emptiness IS the deletion', async () => {
		// Under mirror, { collection, items: [] } deletes every target row in that collection server-side,
		// so a committed-but-empty collection must reach the dry-run — skipping it would make diff report
		// "matches" while a push would destroy rows. The dry-run names the doomed rows in the plan.
		vi.mocked(fetchDiff).mockResolvedValueOnce(null);
		seedData([{ collection: 'articles', primaryKey: 'id', records: [] }]);

		vi.mocked(importBatch).mockResolvedValue(
			importResult({ articles: { existing: [], new: [], deleted: [1, 2], mapped: {} } }),
		);

		await diff({ to: 'staging', mode: 'mirror', project: 'default' }, ctxAt(dir));

		expect(importBatch).toHaveBeenCalledTimes(1);
		expect(vi.mocked(importBatch).mock.calls[0]?.[2]).toMatchObject({ dryRun: true });

		expect(stderr.join('')).toContain('data changes to import to');
		expect(stderr.join('')).not.toContain('matches the local snapshot');
	});
});
