import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { confirm, isCancel, password, text } from '@clack/prompts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CliContext } from '../../kernel/command.js';
import { testConnection } from '../../kernel/config/connection.js';
import { createUi } from '../../kernel/ui.js';
import { add } from './add.js';
import { test as profileTest } from './test.js';

// vitest hoists these above the imports, so the bindings above resolve to the mocks.
vi.mock('@clack/prompts', () => ({
	text: vi.fn(),
	password: vi.fn(),
	confirm: vi.fn(),
	isCancel: vi.fn(() => false),
}));

vi.mock('../../kernel/config/connection.js', () => ({
	testConnection: vi.fn(),
}));

function ctxAt(cwd: string): CliContext {
	return { cwd, interactive: true, ui: createUi({ json: false, color: false }) };
}

describe('interactive profile flows', () => {
	let dir: string;
	let home: string;

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'd6s-icwd-'));
		home = mkdtempSync(join(tmpdir(), 'd6s-ihome-'));

		vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
		vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

		vi.stubEnv('HOME', home);
		vi.stubEnv('USERPROFILE', home);
		vi.stubEnv('CI', '');
		vi.stubEnv('DIRECTUS_TOKEN', '');

		vi.mocked(text).mockReset();
		vi.mocked(password).mockReset();
		vi.mocked(confirm).mockReset();
		vi.mocked(testConnection).mockReset();
		vi.mocked(isCancel).mockReset().mockReturnValue(false);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
		rmSync(dir, { recursive: true, force: true });
		rmSync(home, { recursive: true, force: true });
	});

	it('add prompts for a missing name and url, then writes the profile', async () => {
		vi.mocked(text).mockResolvedValueOnce('staging').mockResolvedValueOnce('https://cms.example.com');
		vi.mocked(confirm).mockResolvedValueOnce(false); // decline adding a token

		await add.run({ args: {}, positionals: [], ctx: ctxAt(dir) });

		const config = JSON.parse(readFileSync(join(dir, 'directus.config.json'), 'utf8'));
		expect(config.profiles.staging.url).toBe('https://cms.example.com');
		expect(text).toHaveBeenCalledTimes(2);
	});

	it('add enters and saves a token when interactive and none was passed', async () => {
		vi.mocked(confirm).mockResolvedValueOnce(true); // add a token? yes (adding it to a profile implies saving)
		vi.mocked(password).mockResolvedValueOnce('tok-abcdefgh');

		await add.run({
			args: { url: 'https://cms.example.com' },
			positionals: ['staging'],
			ctx: ctxAt(dir),
		});

		const store = JSON.parse(readFileSync(join(home, '.directus', 'credentials.json'), 'utf8'));
		expect(store['https://cms.example.com'].staging).toBe('tok-abcdefgh');
	});

	it('test prompts for a token when none resolves, tagging its source', async () => {
		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ profiles: { prod: { url: 'https://cms.example.com', auth: { type: 'token' } } } }),
		);

		vi.stubEnv('DIRECTUS_PROD_TOKEN', '');
		vi.mocked(password).mockResolvedValueOnce('typed-token');
		vi.mocked(confirm).mockResolvedValueOnce(false); // don't persist it
		vi.mocked(testConnection).mockResolvedValueOnce({ user: 'Ada', role: 'Admin', projectName: 'Demo' });

		await profileTest.run({ args: {}, positionals: ['prod'], ctx: ctxAt(dir) });

		expect(password).toHaveBeenCalled();
		expect(testConnection).toHaveBeenCalledWith(expect.objectContaining({ token: 'typed-token', source: 'prompt' }));
	});

	it('a cancelled prompt aborts cleanly instead of proceeding', async () => {
		vi.mocked(text).mockResolvedValueOnce('anything');
		vi.mocked(isCancel).mockReturnValueOnce(true); // user hit Ctrl+C on the first prompt

		await expect(add.run({ args: {}, positionals: [], ctx: ctxAt(dir) })).rejects.toThrow(/Cancelled/);
	});
});
