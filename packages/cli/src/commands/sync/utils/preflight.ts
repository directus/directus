import type { ResolvedCredential } from '../../../kernel/config/credentials.js';
import { fetchAdminAccess, fetchServerVersion } from '../../../kernel/connection.js';
import { CliError } from '../../../kernel/error.js';

/** The release that introduced the server surface sync relies on: mode-aware diffs and the batch import endpoint. */
export const SYNC_MIN_DIRECTUS = '12.2.0';

const [FLOOR_MAJOR, FLOOR_MINOR, FLOOR_PATCH] = SYNC_MIN_DIRECTUS.split('.').map(Number) as [number, number, number];

// An unparseable version gates nothing rather than refusing on a guess.
function belowFloor(version: string): boolean {
	const match = /^(\d+)\.(\d+)\.(\d+)(-)?/.exec(version);

	if (match === null) return false;

	const major = Number(match[1]);
	const minor = Number(match[2]);
	const patch = Number(match[3]);

	if (major !== FLOOR_MAJOR) return major < FLOOR_MAJOR;
	if (minor !== FLOOR_MINOR) return minor < FLOOR_MINOR;
	if (patch !== FLOOR_PATCH) return patch < FLOOR_PATCH;

	// SemVer: a prerelease of the floor itself precedes it.
	return match[4] === '-';
}

// An unreadable version only skips the check — the wire errors backstop it.
async function assertSyncServerVersion(credential: ResolvedCredential, profile: string): Promise<string | undefined> {
	const version = await fetchServerVersion(credential);

	if (version !== undefined && belowFloor(version)) {
		throw new CliError(
			'STATE',
			`Environment Sync needs Directus ${SYNC_MIN_DIRECTUS} or later; "${profile}" runs ${version}.`,
			{
				hint: `Upgrade ${credential.url} to Directus ${SYNC_MIN_DIRECTUS} or later, then re-run.`,
			},
		);
	}

	return version;
}

// The server refuses non-admin schema and import writes; a non-admin read is worse — permission
// filtering silently thins it, so the committed files look complete while missing records.
async function assertAdminAccess(
	credential: ResolvedCredential,
	profile: string,
	warn: (message: string) => void,
): Promise<void> {
	const admin = await fetchAdminAccess(credential);

	if (admin === false) {
		throw new CliError('AUTH', `Environment Sync needs an admin token; "${profile}" resolves to a non-admin user.`, {
			hint: `Non-admin reads are silently filtered by permissions, so synced files can be incomplete without any error. Save an admin token: d6s profile update ${profile} --token <token>`,
		});
	}

	// A real server always answers for an authenticated user, so this is a network flake, not a non-admin.
	if (admin === undefined) {
		warn(`Could not verify that "${profile}" has admin access; continuing.`);
	}
}

/**
 * These gates belong to Environment Sync, not the CLI: future command groups declare their own or none.
 * Returns the server version so the schema drift check does not read it twice.
 */
export async function assertSyncPreflight(
	credential: ResolvedCredential,
	profile: string,
	warn: (message: string) => void,
): Promise<string | undefined> {
	const version = await assertSyncServerVersion(credential, profile);
	await assertAdminAccess(credential, profile, warn);
	return version;
}
