import { beforeEach, describe, expect, test, vi } from 'vitest';

// In-memory stand-in for the system cache so the handshake store/evict cycle is observable.
const store = new Map<string, string>();

vi.mock('../../cache.js', () => ({
	getCache: vi.fn(() => ({
		systemCache: {
			get: vi.fn(async (key: string) => store.get(key)),
			set: vi.fn(async (key: string, value: string) => {
				store.set(key, value);
			}),
			delete: vi.fn(async (key: string) => {
				store.delete(key);
			}),
		},
	})),
}));

vi.mock('../../logger/index.js', () => ({
	useLogger: vi.fn(() => ({ warn: vi.fn(), error: vi.fn() })),
}));

const { dpopKeyFromJwk, dpopKeyToJwk, generateDpopKeypair, loadAndEvictHandshakeDpopKey, storeHandshakeDpopKey } =
	await import('./dpop.js');

beforeEach(() => {
	store.clear();
});

describe('dpop key helpers', () => {
	test('generateDpopKeypair returns an EC P-256 keypair', () => {
		const key = generateDpopKeypair();

		expect(key.privateKey.type).toBe('private');
		expect(key.publicKey.type).toBe('public');
		expect((key.privateKey.export({ format: 'jwk' }) as { crv?: string }).crv).toBe('P-256');
	});

	test('dpopKeyToJwk / dpopKeyFromJwk round-trips the private key', () => {
		const key = generateDpopKeypair();
		const restored = dpopKeyFromJwk(dpopKeyToJwk(key));

		expect(restored).not.toBeNull();
		expect(restored!.privateKey.export({ format: 'jwk' })).toEqual(key.privateKey.export({ format: 'jwk' }));
	});

	test('dpopKeyFromJwk returns null for missing or malformed input', () => {
		expect(dpopKeyFromJwk(null)).toBeNull();
		expect(dpopKeyFromJwk(undefined)).toBeNull();
		expect(dpopKeyFromJwk('not-json')).toBeNull();
	});
});

describe('handshake DPoP cache', () => {
	test('store then loadAndEvict returns the key and removes it (single-use)', async () => {
		const key = generateDpopKeypair();
		await storeHandshakeDpopKey('prov', 'state-1', key, 60_000);

		const loaded = await loadAndEvictHandshakeDpopKey('prov', 'state-1');

		expect(loaded).not.toBeNull();
		expect(loaded!.privateKey.export({ format: 'jwk' })).toEqual(key.privateKey.export({ format: 'jwk' }));

		// single-use: a second load finds nothing because the entry was evicted
		expect(await loadAndEvictHandshakeDpopKey('prov', 'state-1')).toBeNull();
	});

	test('loadAndEvict returns null when the entry is absent', async () => {
		expect(await loadAndEvictHandshakeDpopKey('prov', 'missing')).toBeNull();
	});

	test('loadAndEvict returns null on a corrupt cache entry', async () => {
		store.set('fapi_dpop_prov_bad', 'not-a-jwk');

		expect(await loadAndEvictHandshakeDpopKey('prov', 'bad')).toBeNull();
	});
});
