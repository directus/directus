import path from 'node:path';
import { useEnv } from '@directus/env';
import { ForbiddenError } from '@directus/errors';
import { getExtensionsPath } from '../../../extensions/lib/get-extensions-path.js';
import { isWithinPath } from '../../../utils/is-within-path.js';
import { assertValidStorageLocation } from './assert-valid-storage-location.js';
import { sanitizeFilepath } from './sanitize-filepath.js';

/**
 * Reject storage filepaths that write to "forbidden" locations
 *
 * @throws ForbiddenError
 * @throws InvalidPayloadError when the storage location doesn't exist
 *
 */
export function assertValidStoragePath(filepath: string, storage?: string): void {
	const env = useEnv();
	const location = storage || env.STORAGE_LOCATIONS[0]!;

	assertValidStorageLocation(location);

	const getEnv = (name: string) => (env[name] as string | undefined) ?? '';

	// Bucket-root-relative key for remote locations, relative to the storage root for local ones
	const normalizedFilePath = sanitizeFilepath(filepath);
	const extensionsLocation = getEnv('EXTENSIONS_LOCATION').trim();

	// Block setting path to the extension path on the extensions storage location.
	if (extensionsLocation && extensionsLocation.toUpperCase() === location.toUpperCase()) {
		const remoteExtensionPath = sanitizeFilepath(getEnv('EXTENSIONS_PATH'));

		if (isWithinPath(normalizedFilePath, remoteExtensionPath)) {
			throw new ForbiddenError();
		}
	}

	const storageDriver = getEnv(`STORAGE_${location.toUpperCase()}_DRIVER`);
	const storageRoot = getEnv(`STORAGE_${location.toUpperCase()}_ROOT`);

	// Block local writes to any forbidden locations placed inside storage root
	if (storageDriver === 'local') {
		// Resolve the file like the local driver does, so absolute and relative paths compare
		const filePath = path.resolve(storageRoot, normalizedFilePath);

		for (const blockedPath of getBlockedPaths()) {
			if (isWithinPath(filePath, blockedPath)) {
				throw new ForbiddenError();
			}
		}
	}
}

/**
 * Get the local file paths that Directus uploads should be prevented from uploading to
 */
function getBlockedPaths(): string[] {
	const env = useEnv();
	const packageFileLocation = env['PACKAGE_FILE_LOCATION'];

	// Module extensions are resolved from the package.json dependencies, installed in node_modules
	const packagePaths = [path.resolve('node_modules')];

	if (typeof packageFileLocation === 'string') {
		packagePaths.push(path.join(packageFileLocation, 'package.json'));
		packagePaths.push(path.join(packageFileLocation, 'node_modules'));
	}

	const sqlitePaths = [];

	if (env['DB_CLIENT'] === 'sqlite3' && typeof env['DB_FILENAME'] === 'string') {
		for (const suffix of ['', '-journal', '-wal', '-shm']) {
			sqlitePaths.push(env['DB_FILENAME'] + suffix);
		}
	}

	return [
		getExtensionsPath(),
		env['TEMP_PATH'],
		env['MIGRATIONS_PATH'],
		env['EMAIL_TEMPLATES_PATH'],
		env['CONFIG_PATH'],
		...packagePaths,
		...sqlitePaths,
	].filter((blockedPath) => typeof blockedPath === 'string');
}
