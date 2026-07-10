import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { confirm, isCancel, password, select, text } from '@clack/prompts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loginSession, pingServer, testConnection } from '../../kernel/connection.js';
import { CliError } from '../../kernel/error.js';
import type { CliContext } from '../../kernel/run.js';
import { createUi } from '../../kernel/ui.js';
import { add } from './add.js';
import { testProfile } from './test.js';

// vitest hoists these above the imports, so the bindings above resolve to the mocks.
vi.mock('@clack/prompts', () => ({
	text: vi.fn(),
	password: vi.fn(),
	confirm: vi.fn(),
	select: vi.fn(),
	isCancel: vi.fn(() => false),
}));

vi.mock('../../kernel/connection.js', () => ({
	testConnection: vi.fn(),
	loginSession: vi.fn(),
	pingServer: vi.fn(),
}));

function ctxAt(cwd: string): CliContext {
	return { cwd, configPath: undefined, interactive: true, ui: createUi({ json: false, color: false }) };
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
		vi.mocked(select).mockReset();
		vi.mocked(testConnection).mockReset();
		vi.mocked(loginSession).mockReset();
		vi.mocked(pingServer).mockReset();
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
		vi.mocked(select).mockResolvedValueOnce('skip');

		await add(undefined, {}, ctxAt(dir));

		const config = JSON.parse(readFileSync(join(dir, 'directus.config.json'), 'utf8'));
		expect(config.profiles.staging.url).toBe('https://cms.example.com');
		expect(text).toHaveBeenCalledTimes(2);
		expect(pingServer).toHaveBeenCalledWith('https://cms.example.com');
	});

	it('add enters and saves a pasted token when interactive and none was passed', async () => {
		vi.mocked(select).mockResolvedValueOnce('paste');
		vi.mocked(password).mockResolvedValueOnce('tok-abcdefgh');
		vi.mocked(testConnection).mockResolvedValueOnce({ user: 'Ada', role: 'Admin', projectName: 'Demo' });

		await add('staging', { url: 'https://cms.example.com' }, ctxAt(dir));

		expect(testConnection).toHaveBeenCalledWith({
			url: 'https://cms.example.com',
			token: 'tok-abcdefgh',
			source: 'prompt',
		});

		const store = JSON.parse(readFileSync(join(home, '.directus', 'credentials.json'), 'utf8'));
		expect(store['https://cms.example.com'].staging).toBe('tok-abcdefgh');
	});

	it('lets the user save a token anyway after a failed check', async () => {
		vi.mocked(select).mockResolvedValueOnce('paste').mockResolvedValueOnce('save');
		vi.mocked(password).mockResolvedValueOnce('tok-abcdefgh');
		vi.mocked(testConnection).mockRejectedValueOnce(new CliError('HTTP', 'Could not reach.'));

		await add('staging', { url: 'https://cms.example.com' }, ctxAt(dir));

		const store = JSON.parse(readFileSync(join(home, '.directus', 'credentials.json'), 'utf8'));
		expect(store['https://cms.example.com'].staging).toBe('tok-abcdefgh');
	});

	it('recovers a mistyped URL in place and saves against the corrected URL', async () => {
		vi.mocked(select).mockResolvedValueOnce('paste').mockResolvedValueOnce('url');
		vi.mocked(password).mockResolvedValueOnce('tok-abcdefgh');
		vi.mocked(text).mockResolvedValueOnce('https://real.example.com');

		vi.mocked(testConnection)
			.mockRejectedValueOnce(new CliError('HTTP', 'Could not reach.'))
			.mockResolvedValueOnce({ user: 'Ada', role: 'Admin', projectName: 'Demo' });

		await add('staging', { url: 'https://typo.example.com' }, ctxAt(dir));

		expect(testConnection).toHaveBeenLastCalledWith({
			url: 'https://real.example.com',
			token: 'tok-abcdefgh',
			source: 'prompt',
		});

		const config = JSON.parse(readFileSync(join(dir, 'directus.config.json'), 'utf8'));
		expect(config.profiles.staging.url).toBe('https://real.example.com');

		const store = JSON.parse(readFileSync(join(home, '.directus', 'credentials.json'), 'utf8'));
		expect(store['https://real.example.com'].staging).toBe('tok-abcdefgh');
	});

	it('discards the token on request while keeping the profile', async () => {
		vi.mocked(select).mockResolvedValueOnce('paste').mockResolvedValueOnce('discard');
		vi.mocked(password).mockResolvedValueOnce('tok-abcdefgh');
		vi.mocked(testConnection).mockRejectedValueOnce(new CliError('AUTH', 'Authentication failed.'));

		await add('staging', { url: 'https://cms.example.com' }, ctxAt(dir));

		const config = JSON.parse(readFileSync(join(dir, 'directus.config.json'), 'utf8'));
		expect(config.profiles.staging.url).toBe('https://cms.example.com');
		expect(existsSync(join(home, '.directus', 'credentials.json'))).toBe(false);
	});

	it('still writes the profile when the skip-path URL probe fails and the user continues', async () => {
		vi.mocked(text).mockResolvedValueOnce('staging').mockResolvedValueOnce('https://cms.example.com');
		vi.mocked(select).mockResolvedValueOnce('skip').mockResolvedValueOnce('save');
		vi.mocked(pingServer).mockRejectedValueOnce(new CliError('HTTP', 'Could not reach.'));

		await add(undefined, {}, ctxAt(dir));

		const config = JSON.parse(readFileSync(join(dir, 'directus.config.json'), 'utf8'));
		expect(config.profiles.staging.url).toBe('https://cms.example.com');
	});

	it('add can log in and persist a session from email/password without storing the password itself', async () => {
		vi.mocked(select).mockResolvedValueOnce('login');
		vi.mocked(text).mockResolvedValueOnce('ada@example.com');
		vi.mocked(password).mockResolvedValueOnce('hunter2-pass');
		vi.mocked(loginSession).mockResolvedValueOnce({ user: 'Ada', role: 'Admin', projectName: 'Demo' });

		await add('staging', { url: 'https://cms.example.com' }, ctxAt(dir));

		expect(loginSession).toHaveBeenCalledWith('https://cms.example.com', 'staging', 'ada@example.com', 'hunter2-pass');
	});

	it('test prompts for a token when none resolves, tagging its source', async () => {
		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ profiles: { prod: { url: 'https://cms.example.com', auth: { type: 'token' } } } }),
		);

		vi.stubEnv('DIRECTUS_PROD_TOKEN', '');
		vi.mocked(select).mockResolvedValueOnce('paste');
		vi.mocked(password).mockResolvedValueOnce('typed-token');
		vi.mocked(confirm).mockResolvedValueOnce(false); // don't persist it
		vi.mocked(testConnection).mockResolvedValueOnce({ user: 'Ada', role: 'Admin', projectName: 'Demo' });

		await testProfile('prod', {}, ctxAt(dir));

		expect(password).toHaveBeenCalled();
		expect(testConnection).toHaveBeenCalledWith(expect.objectContaining({ token: 'typed-token', source: 'prompt' }));
	});

	it('test can log in with email/password when no token resolves', async () => {
		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ profiles: { prod: { url: 'https://cms.example.com', auth: { type: 'token' } } } }),
		);

		vi.stubEnv('DIRECTUS_PROD_TOKEN', '');
		vi.mocked(select).mockResolvedValueOnce('login');
		vi.mocked(text).mockResolvedValueOnce('ada@example.com');
		vi.mocked(password).mockResolvedValueOnce('pw-secret');
		vi.mocked(loginSession).mockResolvedValueOnce({ user: 'Ada', role: 'Admin', projectName: 'Demo' });

		await testProfile('prod', {}, ctxAt(dir));

		expect(loginSession).toHaveBeenCalledWith('https://cms.example.com', 'prod', 'ada@example.com', 'pw-secret');
		expect(testConnection).not.toHaveBeenCalled();
	});

	it('test --url works with no config file at all', async () => {
		vi.mocked(testConnection).mockResolvedValueOnce({ user: 'Ada', role: 'Admin', projectName: 'Demo' });

		await testProfile(undefined, { url: 'https://oneoff.example.com', token: 'tok-flag' }, ctxAt(dir));

		expect(testConnection).toHaveBeenCalledWith(
			expect.objectContaining({ url: 'https://oneoff.example.com', token: 'tok-flag', source: 'flag' }),
		);
	});

	it('a cancelled prompt aborts cleanly instead of proceeding', async () => {
		vi.mocked(text).mockResolvedValueOnce('anything');
		vi.mocked(isCancel).mockReturnValueOnce(true); // user hit Ctrl+C on the first prompt

		await expect(add(undefined, {}, ctxAt(dir))).rejects.toThrow(/Cancelled/);
	});
});
