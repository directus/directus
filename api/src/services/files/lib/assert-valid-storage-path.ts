import path from 'node:path';
import { useEnv } from '@directus/env';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { normalizePath, toArray } from '@directus/utils';
import { getExtensionsPath } from '../../../extensions/lib/get-extensions-path.js';
import { isWithinPath } from '../../../utils/is-within-path.js';
import { sanitizeFilepath } from './sanitize-filepath.js';

/**
 * Reject storage locations that aren't configured, as none of the path checks apply to them.
 * Location names are case-sensitive
 *
 * @throws InvalidPayloadError
 *
 */
export function assertValidStorageLocation(storage: unknown): asserts storage is string {
	const env = useEnv();
	const locations = toArray(env['STORAGE_LOCATIONS'] as string).map((location) => location.trim());

	if (typeof storage !== 'string' || locations.includes(storage) === false) {
		throw new InvalidPayloadError({ reason: `Storage location "${storage}" doesn't exist` });
	}
}

/**
 * Reject storage filepaths that write to "forbidden" locations
 *
 * @throws ForbiddenError
 * @throws InvalidPayloadError when the storage location doesn't exist
 *
 */
export function assertValidStoragePath(filepath: string, storage?: string): void {
	const env = useEnv();

	const location = storage || toArray(env['STORAGE_LOCATIONS'] as string)[0]!.trim();

	assertValidStorageLocation(location);
	const storageDriver = env[`STORAGE_${location.toUpperCase()}_DRIVER`] as string | undefined;
	const storageRoot = (env[`STORAGE_${location.toUpperCase()}_ROOT`] as string | undefined) ?? '';

	// Bucket-root-relative key for remote locations, relative to the storage root for local ones
	const normalizedFilePath = sanitizeFilepath(filepath);

	const extensionsLocation = (env['EXTENSIONS_LOCATION'] as string | undefined)?.trim();

	// Block setting path to the extension path on the extensions storage location.
	if (extensionsLocation && extensionsLocation.toUpperCase() === location.toUpperCase()) {
		const remoteExtensionPath = sanitizeFilepath((env['EXTENSIONS_PATH'] as string | undefined) ?? '');

		if (isWithinPath(normalizedFilePath, remoteExtensionPath)) {
			throw new ForbiddenError();
		}
	}

	// Block local writes to any forbidden locations placed inside storage root
	if (storageDriver === 'local') {
		for (const blockedPath of getBlockedPaths(env)) {
			const relativePath = getOverlappingPath(storageRoot, blockedPath);

			if (relativePath !== null && isWithinPath(normalizedFilePath, relativePath)) {
				throw new ForbiddenError();
			}
		}
	}
}

/**
 * Get the local file paths that Directus uploads should be prevented from uploading to
 */
function getBlockedPaths(env: Record<string, unknown>): string[] {
	const packageFileLocation = env['PACKAGE_FILE_LOCATION'];

	// Module extensions are resolved from the package.json dependencies, installed in node_modules
	const packagePaths =
		typeof packageFileLocation === 'string'
			? [path.join(packageFileLocation, 'package.json'), path.join(packageFileLocation, 'node_modules')]
			: [];

	packagePaths.push(path.resolve('node_modules'));

	const dbFilename = env['DB_CLIENT'] === 'sqlite3' ? env['DB_FILENAME'] : undefined;

	const dbFilePaths =
		typeof dbFilename === 'string' ? ['', '-journal', '-wal', '-shm'].map((suffix) => dbFilename + suffix) : [];

	return [
		getExtensionsPath(),
		env['TEMP_PATH'],
		env['MIGRATIONS_PATH'],
		env['EMAIL_TEMPLATES_PATH'],
		env['CONFIG_PATH'],
		...packagePaths,
		...dbFilePaths,
	].filter((blockedPath) => typeof blockedPath === 'string');
}

/**
 * Get a forbidden directory relative to the storage root, to compare against filepaths within that root.
 * Both are resolved against the cwd like the local driver does, so absolute and relative paths compare.
 *
 * @returns The relative directory, an empty string when the whole root is forbidden, or null when they don't overlap
 */
function getOverlappingPath(storageRoot: string, forbiddenPath: string): string | null {
	const root = path.resolve(storageRoot);
	const forbidden = path.resolve(forbiddenPath);

	const isOutside = (relative: string) =>
		relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative);

	// The storage root is the forbidden directory or inside of it
	if (isOutside(path.relative(forbidden, root)) === false) return '';

	const relative = path.relative(root, forbidden);

	return isOutside(relative) ? null : normalizePath(relative);
}
