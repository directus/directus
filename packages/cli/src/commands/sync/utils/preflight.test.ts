import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolvedCredential } from '../../../kernel/config/credentials.js';
import { fetchAdminAccess, fetchServerVersion } from '../../../kernel/connection.js';
import { assertSyncPreflight } from './preflight.js';

vi.mock('../../../kernel/connection.js', () => ({ fetchServerVersion: vi.fn(), fetchAdminAccess: vi.fn() }));

const credential: ResolvedCredential = { kind: 'token', url: 'https://cms.example.com', token: 'token' };

let warnings: string[];

beforeEach(() => {
	warnings = [];
	vi.mocked(fetchAdminAccess).mockResolvedValue(true);
});

function preflight(): Promise<string | undefined> {
	return assertSyncPreflight(credential, 'staging', (message) => warnings.push(message));
}

function serverReports(version: string | undefined): void {
	vi.mocked(fetchServerVersion).mockResolvedValue(version);
}

describe('assertSyncPreflight version floor', () => {
	it('refuses a target below the floor and names both versions', async () => {
		serverReports('12.1.3');

		await expect(preflight()).rejects.toMatchObject({
			code: 'STATE',
			message: 'Environment Sync needs Directus 12.2.0 or later; "staging" runs 12.1.3.',
		});
	});

	it('refuses an older major', async () => {
		serverReports('11.13.4');
		await expect(preflight()).rejects.toMatchObject({ code: 'STATE' });
	});

	it('passes the floor exactly', async () => {
		serverReports('12.2.0');
		await expect(preflight()).resolves.toBe('12.2.0');
	});

	it('compares numerically, not lexicographically', async () => {
		serverReports('12.10.0');
		await expect(preflight()).resolves.toBe('12.10.0');
	});

	it('refuses a prerelease of the floor itself — SemVer places it below', async () => {
		serverReports('12.2.0-beta.1');
		await expect(preflight()).rejects.toMatchObject({ code: 'STATE' });
	});

	it('passes a prerelease above the floor', async () => {
		serverReports('12.3.0-beta.1');
		await expect(preflight()).resolves.toBe('12.3.0-beta.1');
	});

	it('gates nothing when the version is unreadable', async () => {
		serverReports(undefined);
		await expect(preflight()).resolves.toBeUndefined();
	});

	it('gates nothing on an unparseable version', async () => {
		serverReports('a-custom-build');
		await expect(preflight()).resolves.toBe('a-custom-build');
	});
});

describe('assertSyncPreflight admin gate', () => {
	beforeEach(() => {
		serverReports('12.2.0');
	});

	it('passes an admin token without a warning', async () => {
		await expect(preflight()).resolves.toBe('12.2.0');
		expect(warnings).toEqual([]);
	});

	it('refuses a non-admin token — permission-filtered reads make partial files look complete', async () => {
		vi.mocked(fetchAdminAccess).mockResolvedValue(false);

		await expect(preflight()).rejects.toMatchObject({
			code: 'AUTH',
			message: 'Environment Sync needs an admin token; "staging" resolves to a non-admin user.',
		});
	});

	it('warns and continues when admin access cannot be verified — a network flake, not a non-admin', async () => {
		vi.mocked(fetchAdminAccess).mockResolvedValue(undefined);

		await expect(preflight()).resolves.toBe('12.2.0');
		expect(warnings).toEqual(['Could not verify that "staging" has admin access; continuing.']);
	});
});
