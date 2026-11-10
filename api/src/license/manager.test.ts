import { useEnv } from '@directus/env';
import { ForbiddenError } from '@directus/errors';
import {
	activateKey,
	deactivateKey,
	type Directus,
	DIRECTUS_CORE_LICENSE,
	LicenseServerError,
	refreshLicense,
	updateKey,
	verifyLicense,
} from '@directus/license';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { clearCache as clearPermissionCache } from '../permissions/cache.js';
import { UsersService } from '../services/index.js';
import { runExclusive } from '../utils/run-exclusive.js';
import { scheduleSynchronizedJob } from '../utils/schedule.js';
import { EntitlementManager } from './entitlements/manager.js';
import { LicenseManager } from './manager.js';
import { durationToCron } from './utils/duration-to-cron.js';
import { getLicenseKey } from './utils/get-license-key.js';
import { getLicenseToken } from './utils/get-license-token.js';

const settings = vi.hoisted(() => ({ readSingleton: vi.fn(), upsertSingleton: vi.fn() }));

const entitlements = vi.hoisted(() => ({
	setEntitlements: vi.fn(),
	getUsage: vi.fn(),
	resolve: vi.fn(),
	clearCache: vi.fn(),
	checkAll: vi.fn(),
}));

vi.mock('@directus/env', async () => {
	const { mockUseEnv } = await import('../test-utils/env.js');
	return mockUseEnv({ LICENSE_KEY_MANAGEMENT_ENABLED: true });
});

vi.mock('@directus/license', async (importOriginal) => ({
	...(await importOriginal<typeof import('@directus/license')>()),
	activateKey: vi.fn(),
	deactivateKey: vi.fn(),
	refreshLicense: vi.fn(),
	updateKey: vi.fn(),
	verifyLicense: vi.fn(),
}));

vi.mock('../utils/store.js', async () => {
	const { createMockStore } = await import('../test-utils/store.js');
	return { useStore: () => createMockStore().store };
});

vi.mock('../logger/index.js', async () => {
	const { createMockLogger } = await import('../test-utils/logger.js');
	return { useLogger: () => createMockLogger() };
});

vi.mock('../permissions/cache.js', async (importOriginal) => ({
	...(await importOriginal<typeof import('../permissions/cache.js')>()),
	clearCache: vi.fn(),
}));

vi.mock('../services/index.js', () => ({ UsersService: vi.fn() }));

vi.mock('../services/settings.js', () => ({
	SettingsService: vi.fn(function () {
		return settings;
	}),
}));

vi.mock('../utils/get-schema.js', () => ({ getSchema: vi.fn() }));

vi.mock('../utils/run-exclusive.js', () => ({
	runExclusive: vi.fn(async (_name: string, fn: () => unknown) => ({ result: await fn(), leader: true })),
}));

vi.mock('./utils/use-rpc.js', () => ({ useRPC: async () => ({ syncState: vi.fn().mockResolvedValue(undefined) }) }));
vi.mock('./utils/get-license-key.js', () => ({ getLicenseKey: vi.fn() }));
vi.mock('./utils/get-license-token.js', () => ({ getLicenseToken: vi.fn() }));

vi.mock('../utils/schedule.js', () => ({ scheduleSynchronizedJob: vi.fn() }));

vi.mock('./entitlements/manager.js', () => ({
	EntitlementManager: vi.fn(),
	getEntitlementManager: () => entitlements,
}));

vi.mock('./entitlements/lib/collections.js', () => ({ getActiveCollections: vi.fn() }));
vi.mock('./entitlements/lib/flows.js', () => ({ getActiveFlows: vi.fn() }));
vi.mock('./entitlements/lib/seats.js', () => ({ getActiveSeats: vi.fn() }));

const env = useEnv();

const KEY = 'D0000-00000-00000-00000-0000K';

function license(audience: 'directus' | 'monospace') {
	return { audience, entitlements: { seats: { limit: 99 } }, meta: { offline: false } } as unknown as Directus.License;
}

function serverError(code: string) {
	return new LicenseServerError({ message: 'Upstream detail', code });
}

beforeEach(() => {
	vi.mocked(getLicenseKey).mockResolvedValue({ source: null, key: null });
	vi.mocked(getLicenseToken).mockResolvedValue({ source: null, token: null });
	settings.readSingleton.mockResolvedValue({ license_key: null, license_token: null, project_id: 'project' });
});

afterEach(() => {
	vi.clearAllMocks();
	env['LICENSE_KEY_MANAGEMENT_ENABLED'] = true;
	delete env['LICENSE_KEY'];
	delete env['LICENSE_TOKEN'];
});

/** A manager in the state a boot would leave it in; the guards only read this state */
function managerWith(state: { source: 'env' | 'settings' | null; licenseKey: string | null }) {
	const manager = new LicenseManager();
	Object.assign(manager, state);
	return manager;
}

const activeFromSettings = { source: 'settings', licenseKey: KEY } as const;
const core = { source: null, licenseKey: null } as const;

// Each guard throws before any settings read or license server call
describe('license management guards', () => {
	test('a settings license is editable while LICENSE_KEY_MANAGEMENT_ENABLED is on', () => {
		expect(managerWith(activeFromSettings).getEditable()).toBe(true);
	});

	test('an env license is never editable, whatever the flag', () => {
		env['LICENSE_KEY'] = KEY;
		expect(managerWith({ source: 'env', licenseKey: KEY }).getEditable()).toBe(false);
	});

	test.each([
		['activate', (manager: LicenseManager) => manager.activate(KEY)],
		['update', (manager: LicenseManager) => manager.update(KEY)],
		['deactivate', (manager: LicenseManager) => manager.deactivate()],
	])('%s rejects while LICENSE_KEY_MANAGEMENT_ENABLED is off', async (_, manage) => {
		env['LICENSE_KEY_MANAGEMENT_ENABLED'] = false;
		const manager = managerWith(activeFromSettings);

		expect(manager.getEditable()).toBe(false);
		await expect(manage(manager)).rejects.toThrow('You cannot manage license for the current license.');
	});

	test('activate over a stored key updates it', async () => {
		vi.mocked(updateKey).mockResolvedValue({ token: 'token' });

		await managerWith(activeFromSettings).activate('D1111-11111-11111-11111-1111K');

		expect(updateKey).toHaveBeenCalledOnce();
		expect(activateKey).not.toHaveBeenCalled();
	});

	test('activate on CORE activates the key', async () => {
		vi.mocked(activateKey).mockResolvedValue({ token: 'token' });

		await managerWith(core).activate(KEY);

		expect(activateKey).toHaveBeenCalledWith(expect.objectContaining({ license_key: KEY }));
		expect(updateKey).not.toHaveBeenCalled();
	});

	test.each(['INVALID_CREDENTIALS', 'BINDING_MISMATCH'])(
		'activate over a stored key the server rejects with %s activates the new key, as there is no activation to carry over',
		async (code) => {
			vi.mocked(updateKey).mockRejectedValue(serverError(code));
			vi.mocked(activateKey).mockResolvedValue({ token: 'token' });

			await managerWith(activeFromSettings).activate('D1111-11111-11111-11111-1111K');

			expect(activateKey).toHaveBeenCalledWith(
				expect.objectContaining({ license_key: 'D1111-11111-11111-11111-1111K' }),
			);

			expect(settings.upsertSingleton).toHaveBeenCalledWith(
				expect.objectContaining({ license_key: 'D1111-11111-11111-11111-1111K', license_token: 'token' }),
			);
		},
	);

	test('activate does not fall back when the new key is bound to this project elsewhere', async () => {
		vi.mocked(updateKey).mockRejectedValue(serverError('REPLACEMENT_BINDING_MISMATCH'));

		await expect(managerWith(activeFromSettings).activate('D1111-11111-11111-11111-1111K')).rejects.toMatchObject({
			code: 'LICENSE_INVALID',
			extensions: { failure: 'binding_mismatch' },
		});

		expect(activateKey).not.toHaveBeenCalled();
	});

	test('activate reports the rejection of the new key once it falls back to activating it', async () => {
		vi.mocked(updateKey).mockRejectedValue(serverError('INVALID_CREDENTIALS'));
		vi.mocked(activateKey).mockRejectedValue(serverError('LICENSE_NOT_FOUND'));

		await expect(managerWith(activeFromSettings).activate('D1111-11111-11111-11111-1111K')).rejects.toMatchObject({
			code: 'LICENSE_INVALID',
		});
	});

	test('update reports a license server failure as an API error', async () => {
		vi.mocked(updateKey).mockRejectedValue(serverError('SERVICE_UNAVAILABLE'));

		await expect(managerWith(activeFromSettings).update('D1111-11111-11111-11111-1111K')).rejects.toMatchObject({
			code: 'SERVICE_UNAVAILABLE',
		});
	});

	test('update activates the new key when the server rejects the stored key', async () => {
		vi.mocked(updateKey).mockRejectedValue(serverError('BINDING_MISMATCH'));
		vi.mocked(activateKey).mockResolvedValue({ token: 'token' });

		await managerWith(activeFromSettings).update('D1111-11111-11111-11111-1111K');

		expect(activateKey).toHaveBeenCalledWith(expect.objectContaining({ license_key: 'D1111-11111-11111-11111-1111K' }));
	});

	test('activate does not fall back over a transient update failure', async () => {
		vi.mocked(updateKey).mockRejectedValue(serverError('SERVICE_UNAVAILABLE'));

		await expect(managerWith(activeFromSettings).activate('D1111-11111-11111-11111-1111K')).rejects.toMatchObject({
			code: 'SERVICE_UNAVAILABLE',
		});

		expect(activateKey).not.toHaveBeenCalled();
	});

	test.each(['INVALID_CREDENTIALS', 'BINDING_MISMATCH'])(
		'deactivate removes a key the server rejects with %s, as it has no activation to release',
		async (code) => {
			vi.mocked(deactivateKey).mockRejectedValue(serverError(code));

			await managerWith(activeFromSettings).deactivate();

			expect(settings.upsertSingleton).toHaveBeenCalledWith({ license_key: null, license_token: null });
		},
	);

	test('deactivate keeps the key when the server cannot be reached', async () => {
		vi.mocked(deactivateKey).mockRejectedValue(serverError('SERVICE_UNAVAILABLE'));

		await expect(managerWith(activeFromSettings).deactivate()).rejects.toMatchObject({
			code: 'SERVICE_UNAVAILABLE',
		});

		expect(settings.upsertSingleton).not.toHaveBeenCalled();
	});

	test.each([
		['update', (manager: LicenseManager) => manager.update(KEY)],
		['deactivate', (manager: LicenseManager) => manager.deactivate()],
	])('%s rejects on CORE, with no license to manage', async (_, manage) => {
		await expect(manage(managerWith(core))).rejects.toThrow('There is no active license to manage.');
	});

	test.each([
		['billingPortalUrl', (manager: LicenseManager) => manager.billingPortalUrl()],
		['availableAddons', (manager: LicenseManager) => manager.availableAddons()],
		['setAddonQuantity', (manager: LicenseManager) => manager.setAddonQuantity({ addonId: 'a', quantity: 1 })],
		['removeAddon', (manager: LicenseManager) => manager.removeAddon('a')],
	])('%s rejects on CORE', async (_, manage) => {
		await expect(manage(managerWith(core))).rejects.toBeInstanceOf(ForbiddenError);
	});
});

describe('initialize', () => {
	test('both LICENSE_KEY and LICENSE_TOKEN set fails boot rather than exiting the process', async () => {
		env['LICENSE_KEY'] = KEY;
		env['LICENSE_TOKEN'] = 'token';
		const exit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);

		await expect(new LicenseManager().initialize()).rejects.toThrow('LICENSE_KEY and LICENSE_TOKEN cannot both be set');
		expect(exit).not.toHaveBeenCalled();

		exit.mockRestore();
	});

	test.each([
		['an env key', { env: KEY, db: null }],
		['a settings key', { env: undefined, db: KEY }],
	])('%s that fails to activate boots CORE, keeping the key', async (_, keys) => {
		if (keys.env) env['LICENSE_KEY'] = keys.env;
		settings.readSingleton.mockResolvedValue({ license_key: keys.db, license_token: null, project_id: 'project' });
		vi.mocked(activateKey).mockRejectedValue(serverError('SERVICE_UNAVAILABLE'));

		const manager = new LicenseManager();

		await expect(manager.initialize()).resolves.toBeUndefined();
		expect(settings.upsertSingleton).not.toHaveBeenCalled();
		expect(manager.getSource()).toBeNull();
	});

	test.each([
		['BINDING_MISMATCH', 'binding_mismatch'],
		['SERVICE_UNAVAILABLE', 'unavailable'],
	])('a key that fails to activate at boot with %s records %s', async (code, reason) => {
		settings.readSingleton.mockResolvedValue({ license_key: KEY, license_token: null, project_id: 'project' });
		vi.mocked(activateKey).mockRejectedValue(serverError(code));

		const manager = new LicenseManager();
		await manager.initialize();

		await expect(manager.getInvalidReason()).resolves.toBe(reason);
	});

	test('a token left without a key is cleared at boot', async () => {
		settings.readSingleton.mockResolvedValue({ license_key: null, license_token: 'token', project_id: 'project' });

		await new LicenseManager().initialize();

		expect(settings.upsertSingleton).toHaveBeenCalledWith({ license_token: null });
	});

	test('a CORE boot that cannot read the license state fails, even when a second read would succeed', async () => {
		vi.mocked(getLicenseKey).mockRejectedValueOnce(new Error('database unreachable'));

		await expect(new LicenseManager().initialize()).rejects.toThrow('database unreachable');
	});

	test('a boot refresh failing outside the license server keeps the token', async () => {
		settings.readSingleton.mockResolvedValue({ license_key: KEY, license_token: 'token', project_id: 'project' });
		vi.mocked(verifyLicense).mockResolvedValue(license('directus'));
		entitlements.getUsage.mockRejectedValue(new Error('database unreachable'));

		await expect(new LicenseManager().initialize()).resolves.toBeUndefined();
		expect(settings.upsertSingleton).not.toHaveBeenCalledWith(expect.objectContaining({ license_token: null }));
	});

	test('a check failing outside the license server keeps the recorded reason', async () => {
		settings.readSingleton.mockResolvedValue({ license_key: KEY, license_token: 'token', project_id: 'project' });
		vi.mocked(verifyLicense).mockResolvedValue(license('directus'));
		vi.mocked(refreshLicense).mockRejectedValue(serverError('LICENSE_EXPIRED'));
		entitlements.getUsage.mockResolvedValue(0);

		const manager = new LicenseManager();
		await manager.reconcile();

		entitlements.getUsage.mockRejectedValue(new Error('database unreachable'));
		await manager.reconcile();

		await expect(manager.getInvalidReason()).resolves.toBe('expired');
	});

	test('a refresh rejecting with a non license server error records unavailable and keeps the token', async () => {
		settings.readSingleton.mockResolvedValue({ license_key: KEY, license_token: 'token', project_id: 'project' });
		vi.mocked(verifyLicense).mockResolvedValue(license('directus'));
		vi.mocked(refreshLicense).mockRejectedValue(new TypeError("Cannot read properties of null (reading 'token')"));
		entitlements.getUsage.mockResolvedValue(0);

		const manager = new LicenseManager();
		await manager.reconcile();

		await expect(manager.getInvalidReason()).resolves.toBe('unavailable');
		expect(settings.upsertSingleton).not.toHaveBeenCalledWith(expect.objectContaining({ license_token: null }));
	});

	test('a changed env key updates from the stored key', async () => {
		env['LICENSE_KEY'] = 'D1111-11111-11111-11111-1111K';
		settings.readSingleton.mockResolvedValue({ license_key: KEY, license_token: 'token', project_id: 'project' });
		vi.mocked(updateKey).mockResolvedValue({ token: 'token' });

		await new LicenseManager().initialize();

		expect(updateKey).toHaveBeenCalledWith(expect.objectContaining({ license_key: KEY }), {
			license_key: 'D1111-11111-11111-11111-1111K',
		});

		expect(activateKey).not.toHaveBeenCalled();
	});

	test.each(['INVALID_CREDENTIALS', 'BINDING_MISMATCH'])(
		'a changed env key activates when the server rejects the stored key with %s',
		async (code) => {
			env['LICENSE_KEY'] = 'D1111-11111-11111-11111-1111K';
			settings.readSingleton.mockResolvedValue({ license_key: KEY, license_token: 'token', project_id: 'project' });
			vi.mocked(updateKey).mockRejectedValue(serverError(code));
			vi.mocked(activateKey).mockResolvedValue({ token: 'new-token' });

			await new LicenseManager().initialize();

			expect(activateKey).toHaveBeenCalledWith(
				expect.objectContaining({ license_key: 'D1111-11111-11111-11111-1111K' }),
			);

			expect(settings.upsertSingleton).toHaveBeenCalledWith(
				expect.objectContaining({ license_key: 'D1111-11111-11111-11111-1111K', license_token: 'new-token' }),
			);
		},
	);

	test('a changed env key keeps the stored token without activating when the stored key cannot be reached', async () => {
		env['LICENSE_KEY'] = 'D1111-11111-11111-11111-1111K';
		settings.readSingleton.mockResolvedValue({ license_key: KEY, license_token: 'token', project_id: 'project' });
		vi.mocked(updateKey).mockRejectedValue(serverError('SERVICE_UNAVAILABLE'));

		await expect(new LicenseManager().initialize()).resolves.toBeUndefined();

		expect(activateKey).not.toHaveBeenCalled();
		expect(settings.upsertSingleton).not.toHaveBeenCalled();
	});

	test('a key activates at boot even with LICENSE_KEY_MANAGEMENT_ENABLED off', async () => {
		env['LICENSE_KEY'] = KEY;
		env['LICENSE_KEY_MANAGEMENT_ENABLED'] = false;
		vi.mocked(activateKey).mockResolvedValue({ token: 'token' });

		await expect(new LicenseManager().initialize()).resolves.toBeUndefined();
		expect(activateKey).toHaveBeenCalledWith(expect.objectContaining({ license_key: KEY }));
	});
});

describe('reconcile', () => {
	test('the API stays guarded while a license action runs', async () => {
		env['LICENSE_KEY'] = KEY;

		let finish!: (value: { token: string }) => void;
		vi.mocked(activateKey).mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));

		const manager = new LicenseManager();
		const running = manager.reconcile();
		await vi.waitFor(() => expect(activateKey).toHaveBeenCalledOnce());

		await expect(manager.activate(KEY)).rejects.toThrow('You cannot manage license for the current license.');

		finish({ token: 'token' });
		await running;
	});
});

describe('license check', () => {
	const stop = vi.fn();

	beforeEach(() => {
		vi.mocked(scheduleSynchronizedJob).mockReturnValue({ stop });
	});

	async function syncedManager(validationInterval: number | null, key: string | null = KEY) {
		vi.mocked(getLicenseKey).mockResolvedValue({ source: key ? 'settings' : null, key });

		if (validationInterval !== null) {
			vi.mocked(getLicenseToken).mockResolvedValue({ source: 'settings', token: 'token' });

			vi.mocked(verifyLicense).mockResolvedValue({
				...license('directus'),
				meta: { offline: false, validation_interval: validationInterval },
			} as Directus.License);
		}

		const manager = new LicenseManager();
		await manager.syncState();

		return manager;
	}

	function scheduledCron() {
		return vi.mocked(scheduleSynchronizedJob).mock.lastCall?.[1];
	}

	test.each([
		['a healthy license at its validation_interval', 7200, KEY, 7200],
		['a key with no license in effect hourly, to retry', null, KEY, 3600],
		['an offline token without a validation_interval every 12 hours', -1, null, 43_200],
	])('checks %s, seeded by the project', async (_, validationInterval, key, interval) => {
		await (await syncedManager(validationInterval, key)).scheduleCheck();

		expect(scheduledCron()).toBe(durationToCron(interval, 'project'));
	});

	test('no check runs without a key or token, until a key is activated', async () => {
		const manager = await syncedManager(null, null);
		await manager.scheduleCheck();

		expect(scheduleSynchronizedJob).not.toHaveBeenCalled();

		vi.mocked(getLicenseKey).mockResolvedValue({ source: 'settings', key: KEY });
		vi.mocked(getLicenseToken).mockResolvedValue({ source: 'settings', token: 'token' });

		vi.mocked(verifyLicense).mockResolvedValue({
			...license('directus'),
			meta: { offline: false, validation_interval: 7200 },
		} as Directus.License);

		await manager.syncState();

		expect(scheduledCron()).toBe(durationToCron(7200, 'project'));
	});

	test('deactivating the key stops the check', async () => {
		const manager = await syncedManager(7200);
		await manager.scheduleCheck();

		vi.mocked(getLicenseKey).mockResolvedValue({ source: null, key: null });
		vi.mocked(getLicenseToken).mockResolvedValue({ source: null, token: null });

		await manager.syncState();

		expect(stop).toHaveBeenCalledOnce();
		expect(scheduleSynchronizedJob).toHaveBeenCalledOnce();
	});

	test('a sync does not schedule a check that was never scheduled, as in the CLI', async () => {
		await syncedManager(7200);

		expect(scheduleSynchronizedJob).not.toHaveBeenCalled();
	});

	test('a key that activates on a tick, under the startup lock, moves the check from retrying to its validation_interval', async () => {
		const manager = await syncedManager(null);
		await manager.scheduleCheck();

		settings.readSingleton.mockResolvedValue({ license_key: KEY, license_token: null, project_id: 'project' });
		vi.mocked(activateKey).mockResolvedValue({ token: 'token' });
		vi.mocked(getLicenseToken).mockResolvedValue({ source: 'settings', token: 'token' });

		vi.mocked(verifyLicense).mockResolvedValue({
			...license('directus'),
			meta: { offline: false, validation_interval: 7200 },
		} as Directus.License);

		const [, , onTick] = vi.mocked(scheduleSynchronizedJob).mock.calls[0]!;
		await onTick(new Date());

		expect(runExclusive).toHaveBeenCalledWith('license-reconcile', expect.any(Function));
		expect(activateKey).toHaveBeenCalledOnce();
		expect(stop).toHaveBeenCalledOnce();
		expect(scheduledCron()).toBe(durationToCron(7200, 'project'));
	});

	test('concurrent syncs leave a single check', async () => {
		const manager = await syncedManager(null);
		await manager.scheduleCheck();

		vi.mocked(getLicenseToken).mockResolvedValue({ source: 'settings', token: 'token' });

		vi.mocked(verifyLicense).mockResolvedValue({
			...license('directus'),
			meta: { offline: false, validation_interval: 7200 },
		} as Directus.License);

		await Promise.all([manager.syncState(), manager.syncState()]);

		expect(stop).toHaveBeenCalledOnce();
		expect(scheduleSynchronizedJob).toHaveBeenCalledTimes(2);
	});

	test('a reschedule that cannot read the project keeps the current check', async () => {
		const manager = await syncedManager(null);
		await manager.scheduleCheck();

		vi.mocked(getLicenseKey).mockResolvedValue({ source: null, key: null });
		settings.readSingleton.mockRejectedValueOnce(new Error('database unreachable'));

		await manager.syncState();

		expect(stop).not.toHaveBeenCalled();
		expect(scheduleSynchronizedJob).toHaveBeenCalledOnce();
	});

	test('a failing tick is logged, not shared with an instance booting under the same lock', async () => {
		const manager = await syncedManager(7200);
		await manager.scheduleCheck();
		vi.spyOn(manager, 'reconcile').mockRejectedValue(new Error('database unreachable'));

		const [, , onTick] = vi.mocked(scheduleSynchronizedJob).mock.calls[0]!;
		await onTick(new Date());

		await expect(vi.mocked(runExclusive).mock.results.at(-1)!.value).resolves.toMatchObject({ result: undefined });
	});
});

describe('refresh', () => {
	beforeEach(() => {
		entitlements.getUsage.mockResolvedValue(0);
	});

	test('a token that fails verification is kept for the key to renew', async () => {
		vi.mocked(verifyLicense).mockRejectedValue(new Error('expired'));
		vi.mocked(refreshLicense).mockResolvedValue({ token: 'renewed' });

		await new LicenseManager().refresh({ key: KEY, token: 'token' });

		expect(settings.upsertSingleton).toHaveBeenCalledWith({ license_token: 'renewed' });
		expect(settings.upsertSingleton).not.toHaveBeenCalledWith(expect.objectContaining({ license_token: null }));
	});

	test.each(['LICENSE_CANCELED', 'LICENSE_SUSPENDED'])('%s clears the token but keeps the key', async (code) => {
		vi.mocked(verifyLicense).mockResolvedValue(license('directus'));
		vi.mocked(refreshLicense).mockRejectedValue(serverError(code));

		await new LicenseManager().refresh({ key: KEY, token: 'token' });

		expect(settings.upsertSingleton).toHaveBeenCalledWith({ license_token: null });
	});

	test.each([
		['LICENSE_EXPIRED', 'expired'],
		['BINDING_MISMATCH', 'binding_mismatch'],
		['SUBSCRIPTION_PAST_DUE', 'unavailable'],
		['SERVICE_UNAVAILABLE', 'unavailable'],
	])('%s keeps the token, recording %s', async (code, reason) => {
		vi.mocked(verifyLicense).mockResolvedValue(license('directus'));
		vi.mocked(refreshLicense).mockRejectedValue(serverError(code));

		const manager = new LicenseManager();
		await manager.refresh({ key: KEY, token: 'token' });

		expect(settings.upsertSingleton).not.toHaveBeenCalled();
		await expect(manager.getInvalidReason()).resolves.toBe(reason);
	});

	test("the server's reason wins over a token that fails verification", async () => {
		vi.mocked(getLicenseToken).mockResolvedValue({ source: 'settings', token: 'token' });
		vi.mocked(verifyLicense).mockRejectedValue(new Error('expired'));
		vi.mocked(refreshLicense).mockRejectedValue(serverError('LICENSE_EXPIRED'));

		const manager = new LicenseManager();
		await manager.refresh({ key: KEY, token: 'token' });

		await expect(manager.getInvalidReason()).resolves.toBe('expired');
	});

	test('a token that fails verification records the renewal failure when the renewal fails too', async () => {
		vi.mocked(verifyLicense).mockRejectedValue(new Error('expired'));
		vi.mocked(refreshLicense).mockRejectedValue(new Error('license server unreachable'));

		const manager = new LicenseManager();
		await manager.refresh({ key: KEY, token: 'token' });

		await expect(manager.getInvalidReason()).resolves.toBe('unavailable');
	});

	test('a renewal after a failed verification clears the verification reason', async () => {
		vi.mocked(verifyLicense).mockRejectedValue(new Error('expired'));
		vi.mocked(refreshLicense).mockResolvedValue({ token: 'renewed' });

		const manager = new LicenseManager();
		await manager.refresh({ key: KEY, token: 'token' });

		await expect(manager.getInvalidReason()).resolves.toBeNull();
	});

	test('a successful renewal clears the recorded reason', async () => {
		vi.mocked(verifyLicense).mockResolvedValue(license('directus'));
		const manager = new LicenseManager();

		vi.mocked(refreshLicense).mockRejectedValueOnce(serverError('BINDING_MISMATCH'));
		await manager.refresh({ key: KEY, token: 'token' });
		vi.mocked(refreshLicense).mockResolvedValueOnce({ token: 'renewed' });
		await manager.refresh({ key: KEY, token: 'token' });

		await expect(manager.getInvalidReason()).resolves.toBeNull();
	});

	test('a key without a token is renewed with the server', async () => {
		vi.mocked(refreshLicense).mockResolvedValue({ token: 'renewed' });

		await new LicenseManager().refresh({ key: KEY, token: null });

		expect(refreshLicense).toHaveBeenCalledWith(expect.objectContaining({ license_key: KEY }), expect.anything());
		expect(settings.upsertSingleton).toHaveBeenCalledWith({ license_token: 'renewed' });
	});

	test('a key without a token that is still rejected records why, without failing', async () => {
		vi.mocked(refreshLicense).mockRejectedValue(serverError('LICENSE_CANCELED'));

		const manager = new LicenseManager();

		await expect(manager.refresh({ key: KEY, token: null })).resolves.toBeUndefined();
		await expect(manager.getInvalidReason()).resolves.toBe('canceled');
	});
});

describe('pendingResolution', () => {
	const setEntitlements = vi.fn();
	const check = vi.fn();

	beforeEach(() => {
		vi.mocked(EntitlementManager).mockImplementation(function () {
			return { setEntitlements, check } as any;
		});

		check.mockResolvedValue({ allowed: true, valid: true });
	});

	function failing(failed: string, result: object) {
		check.mockImplementation(async (key: string) => (key === failed ? result : { allowed: true, valid: true }));
	}

	test('an admin without an email gets the ADMIN_MISSING_EMAIL blocker for SSO', async () => {
		failing('sso_enabled', { valid: false });

		vi.mocked(UsersService).mockImplementation(function () {
			return { readOne: vi.fn().mockResolvedValue({ email: null, password: 'hash' }) } as any;
		});

		await expect(new LicenseManager().pendingResolution({ adminId: 'admin', licenseKey: null })).resolves.toEqual([
			{ key: 'sso_enabled', kind: 'feature_gate', blockers: ['ADMIN_MISSING_EMAIL'] },
		]);
	});
});

describe('applyResolution', () => {
	async function managerWithReason() {
		entitlements.getUsage.mockResolvedValue(0);
		vi.mocked(verifyLicense).mockResolvedValue(license('directus'));
		vi.mocked(refreshLicense).mockRejectedValue(serverError('LICENSE_EXPIRED'));

		const manager = new LicenseManager();
		await manager.refresh({ key: KEY, token: 'token' });

		return manager;
	}

	test('clears the recorded reason once every limit is met, leaving the license untouched', async () => {
		const manager = await managerWithReason();
		entitlements.checkAll.mockResolvedValue(true);

		await manager.applyResolution({});

		await expect(manager.getInvalidReason()).resolves.toBeNull();
		expect(settings.upsertSingleton).not.toHaveBeenCalled();
	});

	test('clearing the reason neither resyncs nor broadcasts', async () => {
		const manager = await managerWithReason();
		const broadcast = vi.fn();
		Object.assign(manager, { rpc: { syncState: broadcast } });
		entitlements.checkAll.mockResolvedValue(true);
		vi.mocked(clearPermissionCache).mockClear();
		vi.mocked(getLicenseKey).mockClear();

		await manager.applyResolution({});

		expect(clearPermissionCache).not.toHaveBeenCalled();
		expect(getLicenseKey).not.toHaveBeenCalled();
		expect(broadcast).not.toHaveBeenCalled();
	});

	test('keeps the recorded reason while a limit is still exceeded', async () => {
		const manager = await managerWithReason();
		entitlements.checkAll.mockResolvedValue(false);

		await manager.applyResolution({});

		await expect(manager.getInvalidReason()).resolves.toBe('expired');
	});
});

describe('syncState', () => {
	test('applies the entitlements of a verified Directus token', async () => {
		vi.mocked(getLicenseToken).mockResolvedValue({ source: 'settings', token: 'token' });
		vi.mocked(verifyLicense).mockResolvedValue(license('directus'));

		await new LicenseManager().syncState();

		expect(entitlements.setEntitlements).toHaveBeenLastCalledWith({ seats: { limit: 99 } });
	});

	test('a token for another product falls back to CORE', async () => {
		vi.mocked(getLicenseToken).mockResolvedValue({ source: 'settings', token: 'token' });
		vi.mocked(verifyLicense).mockResolvedValue(license('monospace'));

		const manager = new LicenseManager();
		await manager.syncState();

		expect(entitlements.setEntitlements).toHaveBeenLastCalledWith(DIRECTUS_CORE_LICENSE.entitlements);
		expect(manager.getSource()).toBeNull();
	});

	test('an env key outranks a token persisted in settings', async () => {
		vi.mocked(getLicenseKey).mockResolvedValue({ source: 'env', key: KEY });
		vi.mocked(getLicenseToken).mockResolvedValue({ source: 'settings', token: 'token' });
		vi.mocked(verifyLicense).mockResolvedValue(license('directus'));

		const manager = new LicenseManager();
		await manager.syncState();

		expect(manager.getSource()).toBe('env');
	});

	test('a license that no longer verifies drops to CORE on the next sync', async () => {
		vi.mocked(getLicenseToken).mockResolvedValue({ source: 'settings', token: 'token' });
		vi.mocked(verifyLicense).mockResolvedValueOnce(license('directus'));

		const manager = new LicenseManager();
		await manager.syncState();

		vi.mocked(verifyLicense).mockRejectedValue(new Error('expired'));
		await manager.syncState();

		expect(entitlements.setEntitlements).toHaveBeenLastCalledWith(DIRECTUS_CORE_LICENSE.entitlements);
		expect(manager.getSource()).toBeNull();
	});
});
