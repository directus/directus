import { useEnv } from '@directus/env';
import { ForbiddenError } from '@directus/errors';
import { activateKey, type Directus, DIRECTUS_CORE_LICENSE, verifyLicense } from '@directus/license';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LicenseManager } from './manager.js';
import { getLicenseKey } from './utils/get-license-key.js';
import { getLicenseToken } from './utils/get-license-token.js';

const settings = vi.hoisted(() => ({ readSingleton: vi.fn(), upsertSingleton: vi.fn() }));
const entitlements = vi.hoisted(() => ({ setEntitlements: vi.fn() }));

vi.mock('@directus/env', async () => {
	const { mockEnv } = await import('../test-utils/env.js');
	return mockEnv({ LICENSE_KEY_MANAGEMENT_ENABLED: true });
});

vi.mock('@directus/license', async (importOriginal) => ({
	...(await importOriginal<typeof import('@directus/license')>()),
	activateKey: vi.fn(),
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
vi.mock('../utils/run-exclusive.js', () => ({ runExclusive: (_name: string, fn: () => unknown) => fn() }));
vi.mock('./utils/use-rpc.js', () => ({ useRPC: async () => ({ syncState: vi.fn() }) }));
vi.mock('./utils/get-license-key.js', () => ({ getLicenseKey: vi.fn() }));
vi.mock('./utils/get-license-token.js', () => ({ getLicenseToken: vi.fn() }));
vi.mock('../schedules/license.js', () => ({ default: vi.fn(), stopLicenseCheck: vi.fn() }));

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
	return { audience, entitlements: { seats: { limit: 99 } } } as unknown as Directus.License;
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

	test('activate rejects while a license is already active', async () => {
		await expect(managerWith(activeFromSettings).activate(KEY)).rejects.toThrow('A license was already activated');
	});

	test.each([
		['update', (manager: LicenseManager) => manager.update(KEY)],
		['deactivate', (manager: LicenseManager) => manager.deactivate()],
	])('%s rejects on CORE, with no license to manage', async (_, manage) => {
		await expect(manage(managerWith(core))).rejects.toThrow('There is no active license to manage.');
	});

	test.each([
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

	test('an env key that fails to validate fails boot, naming LICENSE_KEY', async () => {
		env['LICENSE_KEY'] = KEY;
		vi.mocked(activateKey).mockRejectedValue(new Error('license server unreachable'));

		await expect(new LicenseManager().initialize()).rejects.toThrow('Unable to validate the LICENSE_KEY');
	});

	test('a settings key that fails to validate downgrades to CORE instead of failing boot', async () => {
		settings.readSingleton.mockResolvedValue({ license_key: KEY, license_token: null, project_id: 'project' });
		vi.mocked(activateKey).mockRejectedValue(new Error('license server unreachable'));

		const manager = new LicenseManager();

		await expect(manager.initialize()).resolves.toBeUndefined();
		expect(settings.upsertSingleton).toHaveBeenCalledWith({ license_key: null, license_token: null });
		expect(manager.getSource()).toBeNull();
		expect(entitlements.setEntitlements).toHaveBeenLastCalledWith(DIRECTUS_CORE_LICENSE.entitlements);
	});

	test('a key activates at boot even with LICENSE_KEY_MANAGEMENT_ENABLED off', async () => {
		env['LICENSE_KEY'] = KEY;
		env['LICENSE_KEY_MANAGEMENT_ENABLED'] = false;
		vi.mocked(activateKey).mockResolvedValue({ token: 'token' });

		await expect(new LicenseManager().initialize()).resolves.toBeUndefined();
		expect(activateKey).toHaveBeenCalledWith(expect.objectContaining({ license_key: KEY }));
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
});
