import type { ResolvedCredential } from '../../../kernel/config/credentials.js';
import { fetchServerVersion } from '../../../kernel/connection.js';
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

/**
 * The floor belongs to Environment Sync, not the CLI: future command groups declare their own or none.
 * An unreadable version only skips the check — the wire errors backstop it.
 */
export async function assertSyncServerVersion(
	credential: ResolvedCredential,
	profile: string,
): Promise<string | undefined> {
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
