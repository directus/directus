import type { Knex } from 'knex';
import { getCache, getCacheValue, setCacheValue } from '../cache.js';
import { getProjectFallbackCompliance } from './fallback-compliance.js';

const CACHE_KEY = 'license-fallback-compliance';

export async function readLicenseFallbackCompliance(): Promise<boolean | undefined> {
	const { systemCache } = getCache();
	const cached = await getCacheValue(systemCache, CACHE_KEY);
	return typeof cached?.['compliant'] === 'boolean' ? cached['compliant'] : undefined;
}

export async function refreshLicenseFallbackCompliance(knex: Knex): Promise<boolean> {
	const compliant = (await getProjectFallbackCompliance(knex)).compliant;
	const { systemCache } = getCache();
	await setCacheValue(systemCache, CACHE_KEY, { compliant });
	return compliant;
}

export async function clearLicenseFallbackCompliance(): Promise<void> {
	const { systemCache } = getCache();
	await systemCache.delete(CACHE_KEY);
}
