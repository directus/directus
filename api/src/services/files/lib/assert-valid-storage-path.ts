import path from 'node:path';
import { useEnv } from '@directus/env';
import { ForbiddenError } from '@directus/errors';
import { toArray } from '@directus/utils';
import { getExtensionsPath } from '../../../extensions/lib/get-extensions-path.js';
import { sanitizeFilepath } from './sanitize-filepath.js';

function isWithinPath(filepath: string, dirpath: string): boolean {
	if (dirpath === '') return true;

	return filepath === dirpath || filepath.startsWith(dirpath + '/');
}

/**
 * Reject storage filepaths that write to "forbidden" locations
 *
 * @throws ForbiddenError
 *
 */
export function assertValidStoragePath(filepath: string, storage?: string): void {
	const env = useEnv();

	const location = storage?.trim() || toArray(env['STORAGE_LOCATIONS'] as string)[0]!.trim();
	const storageDriver = env[`STORAGE_${location.toUpperCase()}_DRIVER`] as string | undefined;
	const storageRoot = (env[`STORAGE_${location.toUpperCase()}_ROOT`] as string | undefined) ?? '';

	const storagePath = sanitizeFilepath(storageRoot);
	const normalizedFilePath = sanitizeFilepath(filepath);

	// Resolve the file to its real location for comparison
	// - storage root for the local
	// - bucket-root-relative key for remote
	const filePath =
		storageDriver === 'local' ? sanitizeFilepath(path.join(storagePath, normalizedFilePath)) : normalizedFilePath;

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
		const tmpPath = sanitizeFilepath((env['TEMP_PATH'] as string | undefined) ?? '');
		const extensionPath = sanitizeFilepath(getExtensionsPath() ?? '');

		if (isWithinPath(filePath, extensionPath)) {
			throw new ForbiddenError();
		}

		if (isWithinPath(filePath, tmpPath)) {
			throw new ForbiddenError();
		}
	}
}
