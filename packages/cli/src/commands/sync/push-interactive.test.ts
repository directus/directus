import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { confirm, isCancel, text } from '@clack/prompts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CliContext } from '../../kernel/run.js';
import { createUi } from '../../kernel/ui.js';
import { applyDiff, fetchDiff } from '../../sync/api.js';
import type { DiffResult } from '../../sync/contract.js';
import { writeSnapshotFiles } from '../../sync/store.js';
import { push } from './push.js';

// vitest hoists these above the imports, so the bindings above resolve to the mocks. The prompts are
// mocked to script the confirm/text answers, and the api seam is mocked so the interactive gate logic
// is tested in isolation from the wire — the assertions are about which gate fired and whether apply ran.
vi.mock('@clack/prompts', () => ({
	confirm: vi.fn(),
	text: vi.fn(),
	isCancel: vi.fn(() => false),
}));

vi.mock('../../sync/api.js', () => ({
	fetchDiff: vi.fn(),
	applyDiff: vi.fn(),
}));

const url = 'https://cms.example.com';
const token = 'super-secret-static-token';

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

	function seedConfig(): void {
		writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ profiles: { staging: { url } } }));
	}

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

		vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
		vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

		// Non-CI so credential resolution is allowed to consult the ambient token; the profile-specific
		// env var is the source resolveTarget reads without prompting.
		vi.stubEnv('HOME', home);
		vi.stubEnv('USERPROFILE', home);
		vi.stubEnv('CI', '');
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', token);

		vi.mocked(confirm).mockReset();
		vi.mocked(text).mockReset();
		vi.mocked(isCancel).mockReset().mockReturnValue(false);
		vi.mocked(fetchDiff).mockReset();
		vi.mocked(applyDiff).mockReset().mockResolvedValue(undefined);

		seedConfig();
		seedSnapshot();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
		rmSync(dir, { recursive: true, force: true });
		rmSync(home, { recursive: true, force: true });
	});

	it('applies once when the operator confirms the push', async () => {
		vi.mocked(fetchDiff).mockResolvedValueOnce(changesResult());
		vi.mocked(confirm).mockResolvedValueOnce(true);

		await push({ to: 'staging', mode: 'merge' }, ctxAt(dir));

		expect(applyDiff).toHaveBeenCalledTimes(1);
	});

	it('aborts without applying when the operator declines the confirmation', async () => {
		vi.mocked(fetchDiff).mockResolvedValueOnce(changesResult());
		vi.mocked(confirm).mockResolvedValueOnce(false);

		await expect(push({ to: 'staging', mode: 'merge' }, ctxAt(dir))).rejects.toThrow(/nothing was applied/i);

		expect(applyDiff).not.toHaveBeenCalled();
	});

	it('still demands the typed confirmation for deletions even with --yes, then applies on an exact match', async () => {
		// The invariant in the interactive path: --yes skips the generic confirm but can never skip the
		// typed deletion confirmation. Typing the profile name exactly is the human consent that unlocks it.
		vi.mocked(fetchDiff).mockResolvedValueOnce(deletionResult());
		vi.mocked(text).mockResolvedValueOnce('staging');

		await push({ to: 'staging', mode: 'mirror', yes: true }, ctxAt(dir));

		expect(confirm).not.toHaveBeenCalled();
		expect(text).toHaveBeenCalledTimes(1);
		expect(applyDiff).toHaveBeenCalledTimes(1);
	});

	it('aborts without applying when the typed deletion confirmation does not match', async () => {
		vi.mocked(fetchDiff).mockResolvedValueOnce(deletionResult());
		vi.mocked(text).mockResolvedValueOnce('nope');

		await expect(push({ to: 'staging', mode: 'mirror', yes: true }, ctxAt(dir))).rejects.toThrow(/did not match/i);

		expect(applyDiff).not.toHaveBeenCalled();
	});
});
