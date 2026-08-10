import { describe, expect, it, vi } from 'vitest';
import type { ResolvedCredential } from '../../../kernel/config/credentials.js';
import { fetchServerVersion } from '../../../kernel/connection.js';
import { assertSyncServerVersion } from './preflight.js';

vi.mock('../../../kernel/connection.js', () => ({ fetchServerVersion: vi.fn() }));

const credential: ResolvedCredential = { kind: 'token', url: 'https://cms.example.com', token: 'token' };

function serverReports(version: string | undefined): void {
	vi.mocked(fetchServerVersion).mockResolvedValue(version);
}

describe('assertSyncServerVersion', () => {
	it('refuses a target below the floor and names both versions', async () => {
		serverReports('12.1.3');

		await expect(assertSyncServerVersion(credential, 'staging')).rejects.toMatchObject({
			code: 'STATE',
			message: 'Environment Sync needs Directus 12.2.0 or later; "staging" runs 12.1.3.',
		});
	});

	it('refuses an older major', async () => {
		serverReports('11.13.4');
		await expect(assertSyncServerVersion(credential, 'staging')).rejects.toMatchObject({ code: 'STATE' });
	});

	it('passes the floor exactly', async () => {
		serverReports('12.2.0');
		await expect(assertSyncServerVersion(credential, 'staging')).resolves.toBe('12.2.0');
	});

	it('compares numerically, not lexicographically', async () => {
		serverReports('12.10.0');
		await expect(assertSyncServerVersion(credential, 'staging')).resolves.toBe('12.10.0');
	});

	it('refuses a prerelease of the floor itself — SemVer places it below', async () => {
		serverReports('12.2.0-beta.1');
		await expect(assertSyncServerVersion(credential, 'staging')).rejects.toMatchObject({ code: 'STATE' });
	});

	it('passes a prerelease above the floor', async () => {
		serverReports('12.3.0-beta.1');
		await expect(assertSyncServerVersion(credential, 'staging')).resolves.toBe('12.3.0-beta.1');
	});

	it('gates nothing when the version is unreadable', async () => {
		serverReports(undefined);
		await expect(assertSyncServerVersion(credential, 'staging')).resolves.toBeUndefined();
	});

	it('gates nothing on an unparseable version', async () => {
		serverReports('a-custom-build');
		await expect(assertSyncServerVersion(credential, 'staging')).resolves.toBe('a-custom-build');
	});
});
