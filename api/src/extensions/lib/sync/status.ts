/**
 * Utility functions to write a `.status` file on the filesystem to indicate active synchronization
 */
import { join } from 'node:path';
import { exists } from 'fs-extra';
import { writeFile, rm } from 'node:fs/promises';
import { getExtensionsPath } from '../get-extensions-path.js';

export const SyncStatus = {
	SYNCING: 'SYNCING',
	IDLE: 'IDLE',
} as const;

export type SyncStatus = keyof typeof SyncStatus;

export async function getSyncStatus(): Promise<SyncStatus> {
	const statusFilePath = join(getExtensionsPath(), '.status');

	if (await exists(statusFilePath)) {
		return SyncStatus.SYNCING;
	}

	return SyncStatus.IDLE;
}

export async function setSyncStatus(status: SyncStatus) {
	const statusFilePath = join(getExtensionsPath(), '.status');

	if (status === SyncStatus.SYNCING) {
		await writeFile(statusFilePath, '');
	} else {
		await rm(statusFilePath);
	}
}

/**
 * Checks the filesystem lock file if we are currently synchronizing
 */
export async function isSynchronizing() {
	const status = await getSyncStatus();
	return status === SyncStatus.SYNCING;
}
