import { useEnv } from '@directus/env';
import { useLogger } from '../../logger/index.js';

const DEFAULT_MAX_CONCURRENCY = 20;

/**
 * Returns the maximum number of concurrent requests to the extensions storage location,
 * falling back to the default when the configured value is not a positive integer
 */
export function getStorageMaxConcurrency(): number {
	const value = Number(useEnv()['EXTENSIONS_STORAGE_MAX_CONCURRENCY']);

	if (!Number.isInteger(value) || value < 1) {
		useLogger().warn(`Invalid EXTENSIONS_STORAGE_MAX_CONCURRENCY value, falling back to ${DEFAULT_MAX_CONCURRENCY}`);

		return DEFAULT_MAX_CONCURRENCY;
	}

	return value;
}
