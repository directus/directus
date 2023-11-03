import { exists } from 'fs-extra';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getExtensionsPath } from './get-extensions-path.js';

/**
 * Retrieves the sync timestamp from the `.timestamp` file in the local extensions folder
 */
export const getSyncTimestamp = async () => {
	const timestampFilePath = join(getExtensionsPath(), '.timestamp');

	if (await exists(timestampFilePath)) {
		const timestamp = await readFile(timestampFilePath, 'utf8');
		return timestamp;
	}

	return null;
};

export const setSyncTimestamp = async (timestamp: string) => {
	const timestampFilePath = join(getExtensionsPath(), '.timestamp');
	await writeFile(timestampFilePath, timestamp);
};
