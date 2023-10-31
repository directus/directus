import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getExtensionsPath } from './get-extensions-path.js';

export enum SyncStatus {
	DONE = 'DONE',
}

/**
 * Retrieves the sync status from the `status` txt file in the local extensions folder
 */
export const getSyncStatus = async () => {
	const statusFilePath = join(getExtensionsPath(), 'status');
	const status = await readFile(statusFilePath, 'utf8');
	return status;
};

export const setSyncStatus = async (status: SyncStatus) => {
	const statusFilePath = join(getExtensionsPath(), 'status');
	await writeFile(statusFilePath, status);
};
