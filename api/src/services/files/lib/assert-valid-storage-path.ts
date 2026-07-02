import path from 'node:path';
import { useEnv } from '@directus/env';
import { ForbiddenError } from '@directus/errors';
import { toArray } from '@directus/utils';
import { sanitizeFilepath } from './sanitize-filepath.js';

/**
 * Reject storage filepaths that write to "forbidden" locations
 *
 * @throws ForbiddenError
 *
 */
export function assertValidStoragePath(filepath: string, storage?: string): void {
	const env = useEnv();
	const location = storage || toArray(env['STORAGE_LOCATIONS'] as string[])[0]!;
	const storageDriver = env[`STORAGE_${location.toUpperCase()}_DRIVER`] as string | undefined;
	const storageRoot = (env[`STORAGE_${location.toUpperCase()}_ROOT`] as string | undefined) ?? '';

	const storagePath = sanitizeFilepath(storageRoot);
	const normalizedFilePath = sanitizeFilepath(filepath);

	// Resolve the file to its real location for comparison
	// - storage root for the local
	// - bucket-root-relative key for remote
	const filePath =
		storageDriver === 'local' ? sanitizeFilepath(path.join(storagePath, normalizedFilePath)) : normalizedFilePath;

	const extensionPath = sanitizeFilepath((env['EXTENSIONS_PATH'] as string | undefined) ?? '');

	// Block setting path to extension path on remote
	if (env['EXTENSIONS_LOCATION'] && env['EXTENSIONS_LOCATION'] === location) {
		if (extensionPath && filePath.startsWith(extensionPath + '/')) {
			throw new ForbiddenError();
		}
	}

	// Block local writes to any forbidden locations placed inside storage root
	if (storageDriver === 'local') {
		const tmpPath = sanitizeFilepath((env['TEMP_PATH'] as string | undefined) ?? '');

		if (extensionPath && filePath.startsWith(extensionPath + '/')) {
			throw new ForbiddenError();
		}

		if (tmpPath && filePath.startsWith(tmpPath + '/')) {
			throw new ForbiddenError();
		}
	}
}
