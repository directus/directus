import { resolve } from 'node:path';
import { DEFAULTS } from '../constants/defaults.js';

/**
 * Get the file location on the local filesystem of the config file
 */
export const getConfigPath = (): string => {
	const path = process.env['CONFIG_PATH'] || DEFAULTS['CONFIG_PATH'];
	return resolve(path as string);
};
