import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { confirm, isCancel, select, text } from '@clack/prompts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CliContext } from '../../kernel/run.js';
import { createUi } from '../../kernel/ui.js';
import { fetchDiff, fetchRecords, importBatch } from '../../sync/api.js';
import type { ImportBatchResult } from '../../sync/contract.js';
import { writeDataFiles } from '../../sync/data-store.js';
import { writeSnapshotFiles } from '../../sync/store.js';
import { diff } from './diff.js';
import { seedProjectConfig, SYNC_TOKEN } from './sync.test-support.js';

// vitest hoists these above the imports so the bindings resolve to the mocks. The prompts are mocked only
// to PROVE they are never called — diff is read-only and must resolve an ambiguity by REPORTING it, never
// by asking — and the api seam is mocked so the reconcile runs in isolation from the wire.
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

		// Non-CI so credential resolution consults the ambient token; the profile-specific env var is what
		// resolveTarget reads without prompting.
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

		// The dry-run ran once (diff always previews) and carried dryRun, never a committing import.
		expect(importBatch).toHaveBeenCalledTimes(1);
		expect(vi.mocked(importBatch).mock.calls[0]?.[2]).toMatchObject({ dryRun: true });

		expect(stderr.join('')).toContain('have no target match yet');
		expect(existsSync(join(dir, 'directus', 'default', 'id_map.json'))).toBe(false);
	});
});
