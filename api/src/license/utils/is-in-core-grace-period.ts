import { getCoreGraceExpiresAt, GRACE_PERIOD_MS } from './get-core-grace-expires-at.js';

export async function isInCoreGracePeriod(): Promise<boolean> {
	const expiresAtSec = await getCoreGraceExpiresAt();
	if (expiresAtSec === null) return false;
	return Date.now() - expiresAtSec * 1000 < GRACE_PERIOD_MS;
}
