import { exists } from 'fs-extra';
import { readFile, writeFile } from 'node:fs/promises';
import { uptime } from 'node:os';
import { join } from 'node:path';
import { getExtensionsPath } from './get-extensions-path.js';

/**
 * Checks if sync is required from the `.timestamp` file in the local extensions folder
 */
export const checkIsSyncRequired = async () => {
	const timestampFilePath = getTimestampFilePath();

	if (!(await exists(timestampFilePath))) {
		return true;
	}

	const timestamp = await readFile(timestampFilePath, 'utf8');

	return timestamp !== getSystemStartTimestamp();
};

/**
 * Sets the system start timestamp to the `.timestamp` file
 */
export const setSyncTimestamp = async () => {
	await writeFile(getTimestampFilePath(), getSystemStartTimestamp());
};

const getTimestampFilePath = () => {
	return join(getExtensionsPath(), '.timestamp');
};

const getSystemStartTimestamp = () => {
	const currentTime = new Date();
	currentTime.setMilliseconds(0);
	return new Date(currentTime.getTime() - uptime() * 1000).toISOString();
};
