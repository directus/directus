import { getCache, getCacheValue, setCacheValue } from '../cache.js';
import type { LicenseTokenPayload } from '../license/types.js';

const CACHE_KEY = 'license-token-payload';

export async function writeCacheTokenPayload(payload: Record<string, unknown>, ttl?: number) {
	const { systemCache } = getCache();

	if (typeof ttl === 'number' && Number.isFinite(ttl) && ttl > 0) {
		await setCacheValue(systemCache, CACHE_KEY, payload, ttl);
		return;
	}

	await setCacheValue(systemCache, CACHE_KEY, payload);
}

export async function readCacheTokenPayload(): Promise<Record<string, unknown> | undefined> {
	const { systemCache } = getCache();
	return await getCacheValue(systemCache, CACHE_KEY);
}

export async function clearCacheTokenPayload() {
	const { systemCache } = getCache();
	await systemCache.delete(CACHE_KEY);
}

export function getLicensePayloadCacheTtl(payload: LicenseTokenPayload): number | undefined {
	if (typeof payload.exp !== 'number' || Number.isNaN(payload.exp)) {
		return undefined;
	}

	const gracePeriod = payload.metadata.grace_period ?? 0;
	const expiresAtMs = payload.exp * 1000 + gracePeriod * 1000;
	const ttlSeconds = Math.ceil((expiresAtMs - Date.now()) / 1000);

	return ttlSeconds > 0 ? ttlSeconds : undefined;
}
