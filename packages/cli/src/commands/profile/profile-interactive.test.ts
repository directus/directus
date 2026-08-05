import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { confirm, isCancel, password, select, text } from '@clack/prompts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createConfigStore } from '../../kernel/config/file.js';
import { loginSession, pingServer, refreshSessionIfNeeded, testConnection } from '../../kernel/connection.js';
import { CliError } from '../../kernel/error.js';
import type { CliContext } from '../../kernel/run.js';
import { createUi } from '../../kernel/ui.js';
import { add } from './add.js';
import { remove } from './remove.js';
import { testProfile } from './test.js';
import { update } from './update.js';

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
	refreshSessionIfNeeded: vi.fn(),
}));

function ctxAt(cwd: string, configPath?: string): CliContext {
	return {
		cwd,
		config: createConfigStore(cwd, configPath),
		interactive: true,
		ui: createUi({ json: false, color: false }),
	};
}

const IDENTITY = { user: 'Ada', role: 'Admin', projectName: 'Demo' };

const SESSION = {
	access_token: 'session-access-value',
	refresh_token: 'session-refresh-value',
	expires: 900_000,
	expires_at: Date.now() + 900_000,
};

describe('interactive profile flows', () => {
	let dir: string;
	let home: string;
	let stderr: string[];

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), 'd6s-icwd-'));
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
		vi.stubEnv('DIRECTUS_TOKEN', '');

		vi.mocked(text).mockReset();
		vi.mocked(password).mockReset();
		vi.mocked(confirm).mockReset();
		vi.mocked(select).mockReset();
		vi.mocked(testConnection).mockReset();
		vi.mocked(loginSession).mockReset();
		vi.mocked(pingServer).mockReset();
		vi.mocked(refreshSessionIfNeeded).mockReset();
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

	it('update confirms before moving a profile to a new URL, and aborts on decline', async () => {
		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ profiles: { staging: { url: 'https://one.example.com', auth: { type: 'token' } } } }),
		);

		vi.mocked(confirm).mockResolvedValueOnce(false);

		await expect(update('staging', { url: 'https://two.example.com' }, ctxAt(dir))).rejects.toMatchObject({
			code: 'USAGE',
		});

		expect(vi.mocked(confirm).mock.calls[0]?.[0]?.message).toContain('https://one.example.com');

		const config = JSON.parse(readFileSync(join(dir, 'directus.config.json'), 'utf8'));
		expect(config.profiles.staging.url).toBe('https://one.example.com');
	});

	it('update overwrites the URL after an accepted confirmation', async () => {
		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ profiles: { staging: { url: 'https://one.example.com', auth: { type: 'token' } } } }),
		);

		vi.mocked(confirm).mockResolvedValueOnce(true);
		vi.mocked(select).mockResolvedValueOnce('skip');

		await update('staging', { url: 'https://two.example.com' }, ctxAt(dir));

		const config = JSON.parse(readFileSync(join(dir, 'directus.config.json'), 'utf8'));
		expect(config.profiles.staging.url).toBe('https://two.example.com');
	});

	it('update seeds the URL prompt with the URL the profile already has, so enter keeps it', async () => {
		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ profiles: { staging: { url: 'https://one.example.com', auth: { type: 'token' } } } }),
		);

		vi.mocked(text).mockResolvedValueOnce('https://one.example.com');
		vi.mocked(select).mockResolvedValueOnce('skip');

		await update('staging', {}, ctxAt(dir));

		expect(vi.mocked(text).mock.calls[0]?.[0]?.initialValue).toBe('https://one.example.com');
		expect(confirm).not.toHaveBeenCalled();

		const config = JSON.parse(readFileSync(join(dir, 'directus.config.json'), 'utf8'));
		expect(config.profiles.staging.url).toBe('https://one.example.com');
	});

	it('add enters and saves a pasted token when interactive and none was passed', async () => {
		vi.mocked(select).mockResolvedValueOnce('paste');
		vi.mocked(password).mockResolvedValueOnce('tok-abcdefgh');
		vi.mocked(testConnection).mockResolvedValueOnce({ user: 'Ada', role: 'Admin', projectName: 'Demo' });

		await add('staging', { url: 'https://cms.example.com' }, ctxAt(dir));

		expect(testConnection).toHaveBeenCalledWith({
			url: 'https://cms.example.com',
			token: 'tok-abcdefgh',
			kind: 'token',
		});

		const store = JSON.parse(readFileSync(join(home, '.directus', 'credentials.json'), 'utf8'));
		expect(store['https://cms.example.com'].staging).toBe('tok-abcdefgh');

		const validate = vi.mocked(password).mock.calls[0]?.[0]?.validate;
		if (typeof validate !== 'function') throw new Error('promptToken must register a callable validator');
		expect(validate('')).toBe('Paste a non-empty token.');
		expect(validate('   ')).toBe('Paste a non-empty token.');
		expect(validate('tok-abcdefgh')).toBeUndefined();
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
			kind: 'token',
		});

		const config = JSON.parse(readFileSync(join(dir, 'directus.config.json'), 'utf8'));
		expect(config.profiles.staging.url).toBe('https://real.example.com');

		const store = JSON.parse(readFileSync(join(home, '.directus', 'credentials.json'), 'utf8'));
		expect(store['https://real.example.com'].staging).toBe('tok-abcdefgh');

		expect(stderr.join('')).not.toContain('Overwrote the URL');
	});

	it('update warns about the overwrite it actually performed — the URL the user settled on, not the one typed first', async () => {
		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ profiles: { staging: { url: 'https://one.example.com', auth: { type: 'token' } } } }),
		);

		vi.mocked(confirm).mockResolvedValueOnce(true);
		vi.mocked(select).mockResolvedValueOnce('paste').mockResolvedValueOnce('url');
		vi.mocked(password).mockResolvedValueOnce('tok-abcdefgh');
		vi.mocked(text).mockResolvedValueOnce('https://three.example.com');

		vi.mocked(testConnection)
			.mockRejectedValueOnce(new CliError('HTTP', 'Could not reach.'))
			.mockResolvedValueOnce({ user: 'Ada', role: 'Admin', projectName: 'Demo' });

		await update('staging', { url: 'https://two.example.com' }, ctxAt(dir));

		const config = JSON.parse(readFileSync(join(dir, 'directus.config.json'), 'utf8'));
		expect(config.profiles.staging.url).toBe('https://three.example.com');

		expect(stderr.join('')).toContain(
			'Overwrote the URL of "staging": https://one.example.com → https://three.example.com',
		);

		expect(stderr.join('')).not.toContain('https://two.example.com');
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
		vi.mocked(loginSession).mockResolvedValueOnce({ identity: IDENTITY, session: SESSION });

		await add('staging', { url: 'https://cms.example.com' }, ctxAt(dir));

		expect(loginSession).toHaveBeenCalledWith('https://cms.example.com', 'ada@example.com', 'hunter2-pass');

		const raw = readFileSync(join(home, '.directus', 'credentials.json'), 'utf8');
		expect(JSON.parse(raw)['https://cms.example.com'].staging.refresh_token).toBe(SESSION.refresh_token);
		expect(raw).not.toContain('hunter2-pass');
	});

	it('does not strand an issued session when the profile write fails', async () => {
		const blocker = join(dir, 'blocker');
		writeFileSync(blocker, 'a regular file, so no config can be written beneath it');

		vi.mocked(select).mockResolvedValueOnce('login');
		vi.mocked(text).mockResolvedValueOnce('ada@example.com');
		vi.mocked(password).mockResolvedValueOnce('hunter2-pass');
		vi.mocked(loginSession).mockResolvedValueOnce({ identity: IDENTITY, session: SESSION });

		const ctx = ctxAt(dir, join(blocker, 'directus.config.json'));

		await expect(add('staging', { url: 'https://cms.example.com' }, ctx)).rejects.toThrow();

		expect(loginSession).toHaveBeenCalled();
		expect(existsSync(join(home, '.directus', 'credentials.json'))).toBe(false);
	});

	it('remove confirms first and keeps the profile on decline — the credential goes with it', async () => {
		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ profiles: { staging: { url: 'https://cms.example.com', auth: { type: 'token' } } } }),
		);

		vi.mocked(confirm).mockResolvedValueOnce(false);

		await expect(remove('staging', {}, ctxAt(dir))).rejects.toMatchObject({ code: 'USAGE' });

		expect(vi.mocked(confirm).mock.calls[0]?.[0]?.message).toContain('saved credential');

		const config = JSON.parse(readFileSync(join(dir, 'directus.config.json'), 'utf8'));
		expect(config.profiles.staging.url).toBe('https://cms.example.com');
	});

	it('remove rejects an unknown profile before it asks anything', async () => {
		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ profiles: { staging: { url: 'https://cms.example.com', auth: { type: 'token' } } } }),
		);

		await expect(remove('stagign', {}, ctxAt(dir))).rejects.toMatchObject({
			code: 'USAGE',
			message: 'Unknown profile: "stagign"',
		});

		expect(confirm).not.toHaveBeenCalled();
	});

	it('test prompts for a token when none resolves, tagging its source', async () => {
		writeFileSync(
			join(dir, 'directus.config.json'),
			JSON.stringify({ profiles: { prod: { url: 'https://cms.example.com', auth: { type: 'token' } } } }),
		);

		vi.stubEnv('DIRECTUS_PROD_TOKEN', '');
		vi.mocked(select).mockResolvedValueOnce('paste');
		vi.mocked(password).mockResolvedValueOnce('typed-token');
		vi.mocked(confirm).mockResolvedValueOnce(false);
		vi.mocked(testConnection).mockResolvedValueOnce({ user: 'Ada', role: 'Admin', projectName: 'Demo' });

		await testProfile('prod', {}, ctxAt(dir));

		expect(password).toHaveBeenCalled();
		expect(testConnection).toHaveBeenCalledWith(expect.objectContaining({ token: 'typed-token', kind: 'token' }));
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
		vi.mocked(loginSession).mockResolvedValueOnce({ identity: IDENTITY, session: SESSION });

		await testProfile('prod', {}, ctxAt(dir));

		expect(loginSession).toHaveBeenCalledWith('https://cms.example.com', 'ada@example.com', 'pw-secret');
		expect(testConnection).not.toHaveBeenCalled();

		const store = JSON.parse(readFileSync(join(home, '.directus', 'credentials.json'), 'utf8'));
		expect(store['https://cms.example.com'].prod.refresh_token).toBe(SESSION.refresh_token);
	});

	it('test --url works with no config file at all', async () => {
		vi.mocked(testConnection).mockResolvedValueOnce({ user: 'Ada', role: 'Admin', projectName: 'Demo' });

		await testProfile(undefined, { url: 'https://oneoff.example.com', token: 'tok-flag' }, ctxAt(dir));

		expect(testConnection).toHaveBeenCalledWith(
			expect.objectContaining({ url: 'https://oneoff.example.com', token: 'tok-flag', kind: 'token' }),
		);
	});

	it('refreshes an expiring saved session before testing it, so a live profile is not reported broken', async () => {
		vi.mocked(testConnection).mockResolvedValueOnce({ user: 'Ada', role: 'Admin', projectName: 'Demo' });

		await testProfile(undefined, { url: 'https://cms.example.com', token: 'tok-flag' }, ctxAt(dir));

		expect(refreshSessionIfNeeded).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://cms.example.com' }));

		const refreshOrder = vi.mocked(refreshSessionIfNeeded).mock.invocationCallOrder[0] ?? Infinity;
		const testOrder = vi.mocked(testConnection).mock.invocationCallOrder[0] ?? 0;
		expect(refreshOrder).toBeLessThan(testOrder);
	});

	it('a cancelled prompt aborts cleanly instead of proceeding', async () => {
		vi.mocked(text).mockResolvedValueOnce('anything');
		vi.mocked(isCancel).mockReturnValueOnce(true);

		await expect(add(undefined, {}, ctxAt(dir))).rejects.toThrow(/Cancelled/);
	});
});
