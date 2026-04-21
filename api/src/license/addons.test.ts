import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { TelemetryReport } from '../telemetry/types/report.js';
import { normalizeLicenseKey } from './license-context.js';

const getCurrentLicenseBinding = vi.fn();
const requestLicenseService = vi.fn();
const isEnvOffline = vi.fn();

vi.mock('./binding.js', () => ({
	getCurrentLicenseBinding,
}));

vi.mock('./env.js', () => ({
	isEnvOffline,
}));

vi.mock('./request.js', () => ({
	requestLicenseService,
}));

describe('license billing integration', () => {
	beforeEach(() => {
		vi.resetModules();
		getCurrentLicenseBinding.mockReset();
		requestLicenseService.mockReset();
		isEnvOffline.mockReset();
		isEnvOffline.mockReturnValue(false);
	});

	test('returns empty addon options when env-offline or no active bound license exists', async () => {
		const { EMPTY_LICENSE_ADDONS, getLicenseAddons } = await import('./addons.js');

		isEnvOffline.mockReturnValueOnce(true);
		await expect(getLicenseAddons()).resolves.toEqual(EMPTY_LICENSE_ADDONS);

		getCurrentLicenseBinding.mockResolvedValue({
			licenseKey: undefined,
			source: 'settings',
			durableStatus: 'inactive',
			storedKeyHash: null,
			storedProjectId: null,
			graceOn: null,
			terminal: null,
		});

		await expect(getLicenseAddons()).resolves.toEqual(EMPTY_LICENSE_ADDONS);
		expect(requestLicenseService).not.toHaveBeenCalled();
	});

	test('requests addon options, billing portal, and addon updates with the active bound license context', async () => {
		const configuredLicenseKey = 'dir-abcdo-abcil-abcdl-abcde-abcdo';
		const normalizedLicenseKey = normalizeLicenseKey(configuredLicenseKey);

		getCurrentLicenseBinding.mockResolvedValue({
			licenseKey: configuredLicenseKey,
			source: 'settings',
			durableStatus: 'active',
			storedKeyHash: '1d4ff4fd4afc13f389477fdfed771f419f3352fb5ba6e834cde7f56d65c2f0cc',
			storedProjectId: 'project-1',
			graceOn: null,
			terminal: null,
		});

		requestLicenseService.mockResolvedValueOnce({ current_subscription: {}, available_addons: [] });
		requestLicenseService.mockResolvedValueOnce({ url: 'https://billing.example.test' });
		requestLicenseService.mockResolvedValueOnce({ token: 'addon-token' });
		requestLicenseService.mockResolvedValueOnce({ success: true });

		const { createLicensePortal, getLicenseAddons, removeLicenseAddon, updateLicenseAddon } = await import(
			'./addons.js'
		);

		await getLicenseAddons();
		await createLicensePortal();

		await updateLicenseAddon({
			addonId: 'addon-1',
			quantity: 4,
			operationId: 'addon-op',
			usageMetrics: {} as TelemetryReport,
		});

		await removeLicenseAddon('addon-1');

		expect(requestLicenseService).toHaveBeenNthCalledWith(1, 'POST', '/api/licenses/addons/options', {
			license_key: normalizedLicenseKey,
			project_id: 'project-1',
		});

		expect(requestLicenseService).toHaveBeenNthCalledWith(2, 'POST', '/api/licenses/portal', {
			license_key: normalizedLicenseKey,
			project_id: 'project-1',
		});

		expect(requestLicenseService).toHaveBeenNthCalledWith(3, 'POST', '/api/licenses/addon', {
			license_key: normalizedLicenseKey,
			project_id: 'project-1',
			addon_id: 'addon-1',
			quantity: 4,
			operation_id: 'addon-op',
			usage_metrics: {},
		});

		expect(requestLicenseService).toHaveBeenNthCalledWith(4, 'DELETE', '/api/licenses/addon', {
			license_key: normalizedLicenseKey,
			project_id: 'project-1',
			addon_id: 'addon-1',
		});
	});

	test('requires an active bound license for billing mutations', async () => {
		getCurrentLicenseBinding.mockResolvedValue({
			licenseKey: undefined,
			source: 'settings',
			durableStatus: 'inactive',
			storedKeyHash: null,
			storedProjectId: null,
			graceOn: null,
			terminal: null,
		});

		const { createLicensePortal, removeLicenseAddon, updateLicenseAddon } = await import('./addons.js');

		await expect(createLicensePortal()).rejects.toMatchObject({ code: 'INVALID_LICENSE_CONFIG' });
		await expect(removeLicenseAddon('addon-1')).rejects.toMatchObject({ code: 'INVALID_LICENSE_CONFIG' });

		await expect(
			updateLicenseAddon({
				addonId: 'addon-1',
				quantity: 2,
				operationId: 'addon-op',
				usageMetrics: {} as TelemetryReport,
			}),
		).rejects.toMatchObject({ code: 'INVALID_LICENSE_CONFIG' });
	});
});
