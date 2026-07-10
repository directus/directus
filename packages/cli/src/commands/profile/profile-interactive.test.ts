import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { confirm, isCancel, password, select, text } from '@clack/prompts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CliContext } from '../../kernel/command.js';
import { loginSession, pingServer, testConnection } from '../../kernel/connection.js';
import { CliError } from '../../kernel/error.js';
import { createUi } from '../../kernel/ui.js';
import { add } from './add.js';
import { test as profileTest } from './test.js';

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
		vi.mocked(select).mockResolvedValueOnce('skip'); // decline adding a token

		await add.run({ args: {}, positionals: [], ctx: ctxAt(dir) });

		const config = JSON.parse(readFileSync(join(dir, 'directus.config.json'), 'utf8'));
		expect(config.profiles.staging.url).toBe('https://cms.example.com');
		expect(text).toHaveBeenCalledTimes(2);

		// With no credential to prove, the URL is still reachability-probed so a typo
		// surfaces at add time rather than on the first real request.
		expect(pingServer).toHaveBeenCalledWith('https://cms.example.com');
	});

	it('add enters and saves a pasted token when interactive and none was passed', async () => {
		vi.mocked(select).mockResolvedValueOnce('paste');
		vi.mocked(password).mockResolvedValueOnce('tok-abcdefgh');
		vi.mocked(testConnection).mockResolvedValueOnce({ user: 'Ada', role: 'Admin', projectName: 'Demo' });

		await add.run({
			args: { url: 'https://cms.example.com' },
			positionals: ['staging'],
			ctx: ctxAt(dir),
		});

		// The pasted token is proven end-to-end (URL + token) before it's persisted.
		expect(testConnection).toHaveBeenCalledWith({
			url: 'https://cms.example.com',
			token: 'tok-abcdefgh',
			source: 'prompt',
		});

		const store = JSON.parse(readFileSync(join(home, '.directus', 'credentials.json'), 'utf8'));
		expect(store['https://cms.example.com'].staging).toBe('tok-abcdefgh');
	});

	it('lets the user save a token anyway after a failed check, instead of forcing a re-run', async () => {
		vi.mocked(select).mockResolvedValueOnce('paste').mockResolvedValueOnce('save');
		vi.mocked(password).mockResolvedValueOnce('tok-abcdefgh');
		vi.mocked(testConnection).mockRejectedValueOnce(new CliError('HTTP', 'Could not reach.'));

		await add.run({ args: { url: 'https://cms.example.com' }, positionals: ['staging'], ctx: ctxAt(dir) });

		// The check failed, but "save anyway" persists it — the instance may just be
		// down, and re-running the whole command to record that is bad DX.
		const store = JSON.parse(readFileSync(join(home, '.directus', 'credentials.json'), 'utf8'));
		expect(store['https://cms.example.com'].staging).toBe('tok-abcdefgh');
	});

	it('recovers a mistyped URL in place: edit it, re-verify, and save without re-running', async () => {
		vi.mocked(select).mockResolvedValueOnce('paste').mockResolvedValueOnce('url'); // method, then "Edit the URL"
		vi.mocked(password).mockResolvedValueOnce('tok-abcdefgh');
		vi.mocked(text).mockResolvedValueOnce('https://real.example.com'); // corrected URL

		vi.mocked(testConnection)
			.mockRejectedValueOnce(new CliError('HTTP', 'Could not reach.')) // typo'd URL fails
			.mockResolvedValueOnce({ user: 'Ada', role: 'Admin', projectName: 'Demo' }); // corrected URL passes

		await add.run({ args: { url: 'https://typo.example.com' }, positionals: ['staging'], ctx: ctxAt(dir) });

		// The corrected URL is what got verified, re-written to the profile, and keyed
		// the saved token — all without leaving the command.
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

	it('discards the token on request, keeping the profile but writing no credential', async () => {
		vi.mocked(select).mockResolvedValueOnce('paste').mockResolvedValueOnce('discard');
		vi.mocked(password).mockResolvedValueOnce('tok-abcdefgh');
		vi.mocked(testConnection).mockRejectedValueOnce(new CliError('AUTH', 'Authentication failed.'));

		await add.run({ args: { url: 'https://cms.example.com' }, positionals: ['staging'], ctx: ctxAt(dir) });

		const config = JSON.parse(readFileSync(join(dir, 'directus.config.json'), 'utf8'));
		expect(config.profiles.staging.url).toBe('https://cms.example.com');
		expect(existsSync(join(home, '.directus', 'credentials.json'))).toBe(false);
	});

	it('still writes the profile when the skip-path URL probe fails and the user continues', async () => {
		vi.mocked(text).mockResolvedValueOnce('staging').mockResolvedValueOnce('https://cms.example.com');
		vi.mocked(select).mockResolvedValueOnce('skip').mockResolvedValueOnce('save'); // skip, then "Continue anyway"
		vi.mocked(pingServer).mockRejectedValueOnce(new CliError('HTTP', 'Could not reach.'));

		await add.run({ args: {}, positionals: [], ctx: ctxAt(dir) });

		const config = JSON.parse(readFileSync(join(dir, 'directus.config.json'), 'utf8'));
		expect(config.profiles.staging.url).toBe('https://cms.example.com');
	});

	it('add bootstraps via email/password login, delegating persistence to a stored session', async () => {
		vi.mocked(select).mockResolvedValueOnce('login');
		vi.mocked(text).mockResolvedValueOnce('ada@example.com'); // email (name/url came from args)
		vi.mocked(password).mockResolvedValueOnce('hunter2-pass');
		vi.mocked(loginSession).mockResolvedValueOnce({ user: 'Ada', role: 'Admin', projectName: 'Demo' });

		await add.run({
			args: { url: 'https://cms.example.com' },
			positionals: ['staging'],
			ctx: ctxAt(dir),
		});

		// add only hands the credentials to loginSession, which persists the rotating
		// session itself (covered in connection.test.ts). The password reaches nothing
		// else — no --email/--password flag, no store write here.
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

		await profileTest.run({ args: {}, positionals: ['prod'], ctx: ctxAt(dir) });

		expect(password).toHaveBeenCalled();
		expect(testConnection).toHaveBeenCalledWith(expect.objectContaining({ token: 'typed-token', source: 'prompt' }));
	});

	it('test can log in with email/password when no token resolves, authenticating via a session', async () => {
		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ profiles: { prod: { url: 'https://cms.example.com', auth: { type: 'token' } } } }),
		);

		vi.stubEnv('DIRECTUS_PROD_TOKEN', '');
		vi.mocked(select).mockResolvedValueOnce('login');
		vi.mocked(text).mockResolvedValueOnce('ada@example.com');
		vi.mocked(password).mockResolvedValueOnce('pw-secret');
		vi.mocked(loginSession).mockResolvedValueOnce({ user: 'Ada', role: 'Admin', projectName: 'Demo' });

		await profileTest.run({ args: {}, positionals: ['prod'], ctx: ctxAt(dir) });

		// Login both authenticates and persists the session, so the static-token
		// verification path is never taken.
		expect(loginSession).toHaveBeenCalledWith('https://cms.example.com', 'prod', 'ada@example.com', 'pw-secret');
		expect(testConnection).not.toHaveBeenCalled();
	});

	it('test --url works with no config file at all, so one-off targets stay first-class', async () => {
		// `dir` deliberately has no directus.config.json.
		vi.mocked(testConnection).mockResolvedValueOnce({ user: 'Ada', role: 'Admin', projectName: 'Demo' });

		await profileTest.run({
			args: { url: 'https://oneoff.example.com', token: 'tok-flag' },
			positionals: [],
			ctx: ctxAt(dir),
		});

		expect(testConnection).toHaveBeenCalledWith(
			expect.objectContaining({ url: 'https://oneoff.example.com', token: 'tok-flag', source: 'flag' }),
		);
	});

	it('a cancelled prompt aborts cleanly instead of proceeding', async () => {
		vi.mocked(text).mockResolvedValueOnce('anything');
		vi.mocked(isCancel).mockReturnValueOnce(true); // user hit Ctrl+C on the first prompt

		await expect(add.run({ args: {}, positionals: [], ctx: ctxAt(dir) })).rejects.toThrow(/Cancelled/);
	});
});
