import { useEnv } from '@directus/env';
import { ForbiddenError } from '@directus/errors';
import {
	activateKey,
	deactivateKey,
	type Directus,
	DIRECTUS_CORE_LICENSE,
	LicenseServerError,
	LicenseVerificationUnavailableError,
	refreshLicense,
	updateKey,
	verifyLicense,
} from '@directus/license';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LicenseManager } from './manager.js';
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
	const { mockEnv } = await import('../test-utils/env.js');
	return mockEnv({ LICENSE_KEY_MANAGEMENT_ENABLED: true });
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
	runExclusive: async (_name: string, fn: () => unknown) => ({ result: await fn(), leader: true }),
}));

vi.mock('./utils/use-rpc.js', () => ({ useRPC: async () => ({ syncState: vi.fn().mockResolvedValue(undefined) }) }));
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
	return { audience, entitlements: { seats: { limit: 99 } }, meta: { offline: false } } as unknown as Directus.License;
}

function serverError(code: string) {
	return new LicenseServerError({ message: 'Upstream detail', code });
}

/** A JWT that decodes to the given expiry, signature and claims beyond `exp` are never checked here */
function tokenExpiringAt(exp: number) {
	return ['e30', Buffer.from(JSON.stringify({ exp })).toString('base64url'), 'sig'].join('.');
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

	test('activate does not fall back over a transient update failure', async () => {
		vi.mocked(updateKey).mockRejectedValue(serverError('SERVICE_UNAVAILABLE'));

		await expect(managerWith(activeFromSettings).activate('D1111-11111-11111-11111-1111K')).rejects.toThrow();
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
			code: 'LICENSE_SERVICE_UNAVAILABLE',
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
		vi.mocked(activateKey).mockRejectedValue(new Error('license server unreachable'));

		const manager = new LicenseManager();

		await expect(manager.initialize()).resolves.toBeUndefined();
		expect(settings.upsertSingleton).not.toHaveBeenCalled();
		expect(manager.getSource()).toBeNull();
	});

	test('a boot refresh failing outside the license server keeps the token', async () => {
		settings.readSingleton.mockResolvedValue({ license_key: KEY, license_token: 'token', project_id: 'project' });
		vi.mocked(verifyLicense).mockResolvedValue(license('directus'));
		entitlements.getUsage.mockRejectedValue(new Error('database unreachable'));

		await expect(new LicenseManager().initialize()).resolves.toBeUndefined();
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
		['SUBSCRIPTION_PAST_DUE', 'payment'],
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

	test('a token that fails verification records verification when the renewal fails too', async () => {
		vi.mocked(verifyLicense).mockRejectedValue(new Error('expired'));
		vi.mocked(refreshLicense).mockRejectedValue(new Error('license server unreachable'));

		const manager = new LicenseManager();
		await manager.refresh({ key: KEY, token: 'token' });

		await expect(manager.getInvalidReason()).resolves.toBe('verification');
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

	test('an unreachable JWKS does not keep a license past its token expiry', async () => {
		const token = tokenExpiringAt(Math.floor(Date.now() / 1000) - 1);
		vi.mocked(getLicenseToken).mockResolvedValue({ source: 'settings', token });
		vi.mocked(verifyLicense).mockResolvedValueOnce(license('directus'));

		const manager = new LicenseManager();
		await manager.syncState();

		vi.mocked(verifyLicense).mockRejectedValue(new LicenseVerificationUnavailableError());
		await manager.syncState();

		expect(entitlements.setEntitlements).toHaveBeenLastCalledWith(DIRECTUS_CORE_LICENSE.entitlements);
	});
});
