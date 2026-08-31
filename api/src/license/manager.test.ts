import { beforeEach, describe, expect, test, vi } from 'vitest';
import { LicenseManager } from './manager.js';

const { env, logger, readSingleton, upsertSingleton, useStore } = vi.hoisted(() => ({
	env: {
		LICENSE_NAMESPACE: 'license',
		LICENSE_LOCK_ACQUIRE_TIMEOUT: 120000,
		LICENSE_KEY_MANAGEMENT_ENABLED: true,
	} as Record<string, unknown>,

	logger: {
		trace: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		fatal: vi.fn(),
	},

	readSingleton: vi.fn(),
	upsertSingleton: vi.fn(),
	useStore: vi.fn(),
}));

vi.mock('@directus/env', () => ({ useEnv: () => env }));
vi.mock('../logger/index.js', () => ({ useLogger: () => logger }));
vi.mock('../utils/store.js', () => ({ useStore: (...args: unknown[]) => useStore(...args) }));
vi.mock('../utils/get-schema.js', () => ({ getSchema: vi.fn().mockResolvedValue({}) }));

vi.mock('../permissions/cache.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('../permissions/cache.js')>()),
	clearCache: vi.fn(),
}));

vi.mock('../services/index.js', () => ({ UsersService: vi.fn() }));
vi.mock('../schedules/license.js', () => ({ default: vi.fn(), stopLicenseCheck: vi.fn() }));
vi.mock('./utils/use-rpc.js', () => ({ useRPC: () => ({ syncState: vi.fn() }) }));
vi.mock('./utils/get-license-key.js', () => ({ getLicenseKey: vi.fn().mockResolvedValue({ key: null }) }));
vi.mock('./utils/get-license-token.js', () => ({ getLicenseToken: vi.fn().mockResolvedValue({ token: null }) }));
vi.mock('./entitlements/lib/collections.js', () => ({ getActiveCollections: vi.fn() }));
vi.mock('./entitlements/lib/flows.js', () => ({ getActiveFlows: vi.fn() }));
vi.mock('./entitlements/lib/seats.js', () => ({ getActiveSeats: vi.fn() }));

vi.mock('./entitlements/manager.js', () => ({
	EntitlementManager: vi.fn(),
	getEntitlementManager: () => ({ setEntitlements: vi.fn() }),
}));

vi.mock('../services/settings.js', () => ({
	SettingsService: vi.fn(() => ({ readSingleton, upsertSingleton })),
}));

const scopedStore = { has: vi.fn(), get: vi.fn(), set: vi.fn(), delete: vi.fn() };

/** Redlock's failure when the lock is held elsewhere for longer than the retry window */
const lockError = new Error('The operation was unable to achieve a quorum during its retry window.');

let lockedStore: ReturnType<typeof vi.fn>;
let unlockedStore: ReturnType<typeof vi.fn>;

beforeEach(() => {
	vi.clearAllMocks();

	delete env['LICENSE_KEY'];
	delete env['LICENSE_TOKEN'];

	readSingleton.mockResolvedValue({});

	lockedStore = vi.fn(async (callback: any) => await callback(scopedStore));
	unlockedStore = vi.fn(async (callback: any) => await callback(scopedStore));
	useStore.mockReturnValue(Object.assign(lockedStore, { unlocked: unlockedStore }));
});

describe('initialize', () => {
	test('sizes the lock retry window based on LICENSE_LOCK_ACQUIRE_TIMEOUT', () => {
		new LicenseManager();

		expect(useStore).toHaveBeenCalledWith('license', {
			lockRetryDelay: 250,
			lockRetryCount: 480,
		});
	});

	test('initializes once through the locked store', async () => {
		const manager = new LicenseManager();

		await manager.initialize();

		expect(lockedStore).toHaveBeenCalledTimes(1);
		expect(unlockedStore).not.toHaveBeenCalled();
	});

	test('retries and falls back to the unlocked store when the lock cannot be acquired', async () => {
		lockedStore.mockRejectedValue(lockError);

		const manager = new LicenseManager();

		await expect(manager.initialize()).resolves.toBeUndefined();

		expect(lockedStore).toHaveBeenCalledTimes(2);
		expect(unlockedStore).toHaveBeenCalledTimes(1);
		expect(logger.warn).toHaveBeenCalled();
	});

	test('initializes through the locked store on a subsequent attempt', async () => {
		lockedStore.mockRejectedValueOnce(lockError);

		const manager = new LicenseManager();

		await manager.initialize();

		expect(lockedStore).toHaveBeenCalledTimes(2);
		expect(unlockedStore).not.toHaveBeenCalled();
	});

	test('ignores a lock failure once initialization completed', async () => {
		lockedStore.mockImplementation(async (callback: any) => {
			await callback(scopedStore);
			throw lockError;
		});

		const manager = new LicenseManager();

		await expect(manager.initialize()).resolves.toBeUndefined();

		expect(lockedStore).toHaveBeenCalledTimes(1);
		expect(unlockedStore).not.toHaveBeenCalled();
	});

	test('propagates failures from within the critical section', async () => {
		const error = new Error('Settings unavailable');
		readSingleton.mockRejectedValue(error);

		const manager = new LicenseManager();

		await expect(manager.initialize()).rejects.toThrow(error);

		expect(lockedStore).toHaveBeenCalledTimes(1);
		expect(unlockedStore).not.toHaveBeenCalled();
	});
});
