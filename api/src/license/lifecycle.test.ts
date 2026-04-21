import { InvalidLicenseConfigError, InvalidLicenseTokenError } from '@directus/errors';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { clearSystemCache } from '../cache.js';
import { verify } from '../utils/verify-token.js';
import { getCurrentLicenseBinding } from './binding.js';
import { getEnvOfflinePayload, isEnvOffline, toEnvOfflineConfigError } from './env.js';
import { hashLicenseKey } from './license-context.js';
import {
	applyLicense,
	deactivateCurrentLicense,
	initializeLicenseRuntime,
	restoreStoredLicense,
	syncLicenseTokenFromService,
} from './lifecycle.js';
import { activateLicense, deactivateLicense, validateLicense } from './service.js';
import { getLicenseToken, saveLicenseKey, saveLicenseToken, updateLicenseState } from './storage.js';

vi.mock('../telemetry/lib/get-report.js', () => ({
	getReport: vi.fn().mockResolvedValue({}),
}));

vi.mock('../cache.js', () => ({
	clearSystemCache: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../utils/cache-token-payload.js', () => ({
	clearCacheTokenPayload: vi.fn().mockResolvedValue(undefined),
	getLicensePayloadCacheTtl: vi.fn().mockReturnValue(60),
	writeCacheTokenPayload: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../utils/get-project-id.js', () => ({
	getProjectId: vi.fn().mockResolvedValue('project_1'),
}));

vi.mock('../utils/set-project-id.js', () => ({
	setProjectId: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../utils/verify-token.js', () => ({
	verify: vi.fn().mockResolvedValue({
		metadata: {
			project_id: 'project_1',
			grace_period: 0,
		},
	}),
}));

vi.mock('./binding.js', () => ({
	clearLicenseState: vi.fn().mockResolvedValue(undefined),
	getCurrentLicenseBinding: vi.fn(),
}));

vi.mock('./env.js', () => ({
	getEnvOfflinePayload: vi.fn(),
	isEnvOffline: vi.fn(),
	toEnvOfflineConfigError: vi.fn(
		(error: unknown) =>
			new InvalidLicenseConfigError(
				{ reason: 'DIRECTUS_LICENSE_OFFLINE_TOKEN is invalid or not offline-enabled' },
				error instanceof Error ? { cause: error } : undefined,
			),
	),
}));

vi.mock('./service.js', () => ({
	activateLicense: vi.fn(),
	deactivateLicense: vi.fn(),
	validateLicense: vi.fn(),
}));

vi.mock('./storage.js', () => ({
	getLicenseToken: vi.fn(),
	readLicenseState: vi.fn(),
	saveLicenseKey: vi.fn().mockResolvedValue(undefined),
	saveLicenseToken: vi.fn().mockResolvedValue(undefined),
	updateLicenseState: vi.fn().mockResolvedValue(undefined),
}));

const mockedGetCurrentLicenseBinding = vi.mocked(getCurrentLicenseBinding);
const mockedActivateLicense = vi.mocked(activateLicense);
const mockedDeactivateLicense = vi.mocked(deactivateLicense);
const mockedValidateLicense = vi.mocked(validateLicense);
const mockedGetEnvOfflinePayload = vi.mocked(getEnvOfflinePayload);
const mockedIsEnvOffline = vi.mocked(isEnvOffline);
const mockedToEnvOfflineConfigError = vi.mocked(toEnvOfflineConfigError);
const mockedGetLicenseToken = vi.mocked(getLicenseToken);
const mockedSaveLicenseKey = vi.mocked(saveLicenseKey);
const mockedSaveLicenseToken = vi.mocked(saveLicenseToken);
const mockedUpdateLicenseState = vi.mocked(updateLicenseState);
const mockedVerify = vi.mocked(verify);
const mockedClearSystemCache = vi.mocked(clearSystemCache);

describe('applyLicense', () => {
	beforeEach(() => {
		mockedGetEnvOfflinePayload.mockResolvedValue(undefined);
		mockedIsEnvOffline.mockReturnValue(false);
		mockedGetLicenseToken.mockResolvedValue('stored-token');
		mockedActivateLicense.mockResolvedValue({ token: 'fresh-token' });
		mockedDeactivateLicense.mockResolvedValue({ deactivated: true });
		mockedValidateLicense.mockResolvedValue({ token: 'validated-token' });

		mockedVerify.mockResolvedValue({
			metadata: {
				project_id: 'project_1',
				grace_period: 0,
			},
		} as never);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	test('validated when normalized key variants matched the stored key hash', async () => {
		mockedGetCurrentLicenseBinding.mockResolvedValue({
			licenseKey: 'DIR-ABCD0-12341-FGH1J-67891-K1MN0',
			source: 'settings',
			durableStatus: 'active',
			terminal: null,
			storedKeyHash: hashLicenseKey(' dir-abcdo-1234i-fghij-6789l-klmno '),
			storedProjectId: 'project_1',
			graceOn: null,
		});

		const result = await applyLicense(' dir-abcdo-1234i-fghij-6789l-klmno ', {
			publicUrl: 'https://example.com',
			source: 'settings',
		});

		expect(result.action).toBe('validate');

		expect(mockedValidateLicense).toHaveBeenCalledWith({
			licenseKey: ' dir-abcdo-1234i-fghij-6789l-klmno ',
			projectId: 'project_1',
			publicUrl: 'https://example.com',
			usageMetrics: {},
		});

		expect(mockedActivateLicense).not.toHaveBeenCalled();

		expect(mockedDeactivateLicense).not.toHaveBeenCalled();
	});

	test('used local verification for stored-token inspection before remote validation', async () => {
		mockedGetCurrentLicenseBinding.mockResolvedValue({
			licenseKey: 'same-key',
			source: 'settings',
			durableStatus: 'active',
			terminal: null,
			storedKeyHash: hashLicenseKey('same-key'),
			storedProjectId: 'project_1',
			graceOn: null,
		});

		mockedVerify
			.mockResolvedValueOnce({
				metadata: {
					project_id: 'project_1',
					public_url: 'https://stored.example',
					grace_period: 0,
				},
			} as never)
			.mockResolvedValueOnce({
				metadata: {
					project_id: 'project_1',
					grace_period: 0,
				},
			} as never);

		await applyLicense('same-key', {
			publicUrl: 'https://new.example',
			source: 'settings',
		});

		expect(mockedVerify).toHaveBeenNthCalledWith(1, 'stored-token', { mode: 'local' });

		expect(mockedValidateLicense).toHaveBeenCalledWith({
			licenseKey: 'same-key',
			projectId: 'project_1',
			publicUrl: 'https://stored.example',
			newPublicUrl: 'https://new.example',
			usageMetrics: {},
		});

		expect(mockedVerify).toHaveBeenNthCalledWith(2, 'validated-token');
	});

	test('deactivated the previous binding before activating a different key', async () => {
		mockedGetCurrentLicenseBinding.mockResolvedValue({
			licenseKey: 'old-key',
			source: 'settings',
			durableStatus: 'active',
			terminal: null,
			storedKeyHash: hashLicenseKey('old-key'),
			storedProjectId: 'project_1',
			graceOn: null,
		});

		const result = await applyLicense('new-key', {
			publicUrl: 'https://example.com',
			source: 'settings',
		});

		expect(result.action).toBe('activate');

		expect(mockedDeactivateLicense).toHaveBeenCalledWith({
			projectId: 'project_1',
			licenseToken: 'stored-token',
		});

		expect(mockedActivateLicense).toHaveBeenCalledWith({
			licenseKey: 'new-key',
			projectId: 'project_1',
			publicUrl: 'https://example.com',
		});
	});

	test('reactivated the previous settings-managed key when the new activation failed', async () => {
		mockedGetCurrentLicenseBinding.mockResolvedValue({
			licenseKey: 'old-key',
			source: 'settings',
			durableStatus: 'active',
			terminal: null,
			storedKeyHash: hashLicenseKey('old-key'),
			storedProjectId: 'project_1',
			graceOn: null,
		});

		mockedActivateLicense.mockRejectedValueOnce(new Error('Activation failed')).mockResolvedValueOnce({
			token: 'restored-token',
		});

		await expect(
			applyLicense('new-key', {
				publicUrl: 'https://example.com',
				source: 'settings',
			}),
		).rejects.toThrow('Activation failed');

		expect(mockedDeactivateLicense).toHaveBeenCalledWith({
			projectId: 'project_1',
			licenseToken: 'stored-token',
		});

		expect(mockedActivateLicense).toHaveBeenNthCalledWith(1, {
			licenseKey: 'new-key',
			projectId: 'project_1',
			publicUrl: 'https://example.com',
		});

		expect(mockedActivateLicense).toHaveBeenNthCalledWith(2, {
			licenseKey: 'old-key',
			projectId: 'project_1',
			publicUrl: 'https://example.com',
		});

		expect(mockedSaveLicenseKey).toHaveBeenCalledWith('old-key', undefined);

		expect(mockedSaveLicenseToken).toHaveBeenCalledWith('restored-token', undefined);

		expect(mockedUpdateLicenseState).toHaveBeenCalledWith(
			expect.objectContaining({
				license_key_hash: hashLicenseKey('old-key'),
				license_status: 'active',
			}),
			undefined,
		);
	});

	test('cleared system cache after activating a new license', async () => {
		mockedGetCurrentLicenseBinding.mockResolvedValue({
			licenseKey: undefined,
			source: null,
			durableStatus: 'inactive',
			terminal: null,
			storedKeyHash: null,
			storedProjectId: null,
			graceOn: null,
		});

		await applyLicense('new-key', {
			publicUrl: 'https://example.com',
			source: 'settings',
		});

		expect(mockedClearSystemCache).toHaveBeenCalledTimes(1);
	});

	test('cleared system cache after validating an existing license', async () => {
		mockedGetCurrentLicenseBinding.mockResolvedValue({
			licenseKey: 'same-key',
			source: 'settings',
			durableStatus: 'active',
			terminal: null,
			storedKeyHash: hashLicenseKey('same-key'),
			storedProjectId: 'project_1',
			graceOn: null,
		});

		await applyLicense('same-key', {
			publicUrl: 'https://example.com',
			source: 'settings',
		});

		expect(mockedClearSystemCache).toHaveBeenCalledTimes(1);
	});
});

describe('deactivateCurrentLicense', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	test('preferred the settings-managed license key over the stored token', async () => {
		mockedGetCurrentLicenseBinding.mockResolvedValue({
			licenseKey: 'settings-key',
			source: 'settings',
			durableStatus: 'active',
			terminal: null,
			storedKeyHash: hashLicenseKey('settings-key'),
			storedProjectId: 'project_1',
			graceOn: null,
		});

		mockedGetLicenseToken.mockResolvedValue('stored-token');
		mockedDeactivateLicense.mockResolvedValue({ deactivated: true });

		await deactivateCurrentLicense();

		expect(mockedDeactivateLicense).toHaveBeenCalledWith({
			projectId: 'project_1',
			licenseKey: 'settings-key',
		});

		expect(mockedClearSystemCache).toHaveBeenCalledTimes(1);
	});
});

describe('syncLicenseTokenFromService', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	test('cleared system cache after syncing a new token', async () => {
		await syncLicenseTokenFromService('fresh-token', {
			licenseKey: 'same-key',
		});

		expect(mockedClearSystemCache).toHaveBeenCalledTimes(1);
	});
});

describe('foundation runtime restore semantics', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	test('restored stored tokens with local verification only', async () => {
		mockedGetEnvOfflinePayload.mockResolvedValue(undefined);

		mockedGetCurrentLicenseBinding.mockResolvedValue({
			licenseKey: ' dir-abcdo-1234i-fghij-6789l-klmno ',
			source: 'settings',
			durableStatus: 'active',
			terminal: null,
			storedKeyHash: hashLicenseKey('DIR-ABCD0-12341-FGH1J-67891-K1MN0'),
			storedProjectId: 'project_1',
			graceOn: null,
		});

		mockedGetLicenseToken.mockResolvedValue('stored-token');

		mockedVerify.mockResolvedValue({
			metadata: {
				project_id: 'project_1',
				grace_period: 0,
			},
		} as never);

		await restoreStoredLicense({ cache: false });

		expect(mockedVerify).toHaveBeenCalledWith('stored-token', { mode: 'local' });
	});

	test('mapped invalid env offline tokens through the shared config helper', async () => {
		const tokenError = new InvalidLicenseTokenError({ reason: 'invalid offline token' });

		const mappedError = new InvalidLicenseConfigError({
			reason: 'DIRECTUS_LICENSE_OFFLINE_TOKEN is invalid or not offline-enabled',
		});

		mockedGetEnvOfflinePayload.mockRejectedValue(tokenError);
		mockedIsEnvOffline.mockReturnValue(true);
		mockedToEnvOfflineConfigError.mockReturnValue(mappedError);

		await expect(initializeLicenseRuntime()).rejects.toBe(mappedError);
		expect(mockedToEnvOfflineConfigError).toHaveBeenCalledWith(tokenError);
	});
});
