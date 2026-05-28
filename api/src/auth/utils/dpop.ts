import { createPrivateKey, createPublicKey, generateKeyPairSync, type KeyObject } from 'node:crypto';
import { getCache } from '../../cache.js';
import { useLogger } from '../../logger/index.js';

export interface DpopKey {
	privateKey: KeyObject;
	publicKey: KeyObject;
}

export function generateDpopKeypair(): DpopKey {
	const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
	return { privateKey, publicKey };
}

function handshakeCacheKey(provider: string, state: string): string {
	return `fapi_dpop_${provider}_${state}`;
}

/**
 * Store the DPoP private key in the system cache keyed on (provider, OAuth state).
 * TTL is supplied by the caller — must be ≥ the login-handshake cookie TTL so a
 * slow consent / MFA screen can't evict the key before the callback arrives.
 */
export async function storeHandshakeDpopKey(
	provider: string,
	state: string,
	key: DpopKey,
	ttlMs: number,
): Promise<void> {
	const { systemCache } = getCache();
	const jwk = key.privateKey.export({ format: 'jwk' });
	await systemCache.set(handshakeCacheKey(provider, state), JSON.stringify(jwk), ttlMs);
}

/**
 * Retrieve and evict the DPoP private key for the given (provider, OAuth state).
 * Eviction happens only after a successful parse so that a corrupt cache entry is
 * diagnosable; on the success path the key is evicted before being returned to the
 * caller to preserve single-use semantics.
 */
export async function loadAndEvictHandshakeDpopKey(provider: string, state: string): Promise<DpopKey | null> {
	const { systemCache } = getCache();
	const cacheKey = handshakeCacheKey(provider, state);
	const raw = await systemCache.get(cacheKey);

	if (!raw) return null;

	try {
		const jwk = typeof raw === 'string' ? JSON.parse(raw) : raw;
		const privateKey = createPrivateKey({ key: jwk, format: 'jwk' });
		const publicKey = createPublicKey(privateKey);
		await systemCache.delete(cacheKey);
		return { privateKey, publicKey };
	} catch (e) {
		useLogger().warn(e, `[FAPI] Failed to parse cached DPoP handshake key (cacheKey suffix ${state.slice(-8)})`);
		return null;
	}
}

/**
 * Serialize a DPoP private key to a JWK string for storage in auth_data JSONB.
 * The key migrates from the handshake cache (no userId yet) to auth_data after
 * token exchange (userId resolved). Same key throughout the access-token lifetime —
 * required by RFC 9449 §5 since cnf.jkt is bound to this key's thumbprint.
 */
export function dpopKeyToJwk(key: DpopKey): string {
	return JSON.stringify(key.privateKey.export({ format: 'jwk' }));
}

/**
 * Reconstruct a DPoP KeyObject from a JWK string stored in auth_data.
 * Returns null if the JWK is absent or malformed.
 */
export function dpopKeyFromJwk(raw: string | null | undefined): DpopKey | null {
	if (!raw) return null;

	try {
		const jwk = typeof raw === 'string' ? JSON.parse(raw) : raw;
		const privateKey = createPrivateKey({ key: jwk, format: 'jwk' });
		const publicKey = createPublicKey(privateKey);
		return { privateKey, publicKey };
	} catch {
		return null;
	}
}
