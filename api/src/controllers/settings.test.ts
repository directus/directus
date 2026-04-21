import { beforeEach, describe, expect, test, vi } from 'vitest';
import { LICENSE_CHANGE_BLOCKED } from '../license/constants.js';

const { getCurrentLicenseBinding, assessProposedLicenseChange, applyLicense, deactivateCurrentLicense } = vi.hoisted(
	() => ({
		getCurrentLicenseBinding: vi.fn(),
		assessProposedLicenseChange: vi.fn(),
		applyLicense: vi.fn(),
		deactivateCurrentLicense: vi.fn(),
	}),
);

vi.mock('../database/index.js');

vi.mock('../middleware/respond.js', () => ({
	respond: vi.fn((_req, _res, next) => next()),
}));

vi.mock('../license/binding.js', () => ({
	getCurrentLicenseBinding,
}));

vi.mock('../license/license-change.js', () => ({
	assessProposedLicenseChange,
}));

vi.mock('../license/lifecycle.js', () => ({
	applyLicense,
	deactivateCurrentLicense,
}));

vi.mock('../services/settings.js', () => {
	const SettingsService = vi.fn();
	SettingsService.prototype.readSingleton = vi.fn().mockResolvedValue({});
	SettingsService.prototype.upsertSingleton = vi.fn().mockResolvedValue(undefined);
	SettingsService.prototype.setOwner = vi.fn().mockResolvedValue(undefined);
	return { SettingsService };
});

describe('settings controller license workflow', () => {
	let patchHandler: (req: any, res: any, next: any) => Promise<void>;

	beforeEach(async () => {
		getCurrentLicenseBinding.mockReset();
		assessProposedLicenseChange.mockReset();
		applyLicense.mockReset();
		deactivateCurrentLicense.mockReset();

		const { default: router } = await import('./settings.js');

		const patchRouteLayer = (router as any).stack.find(
			(layer: any) => layer.route?.path === '/' && layer.route.methods.patch,
		);

		patchHandler = patchRouteLayer.route.stack[0].handle as (req: any, res: any, next: any) => Promise<void>;
	});

	test('blocks settings patch when proposed license is not compliant', async () => {
		getCurrentLicenseBinding.mockResolvedValue({ source: 'settings', licenseKey: undefined });

		assessProposedLicenseChange.mockResolvedValue({
			compliant: false,
			target_mode: 'license_change',
			target_entitlements: {
				collections: { limit: 1 },
				seats: { limit: 1 },
				sso_enabled: false,
			},
			sections: [],
		});

		const next = vi.fn();

		const req = {
			body: {
				license_key: 'dir-abcde-abcd2-abcd3-abcd4-abcd5',
			},
			accountability: null,
			schema: { collections: {}, relations: [] },
			sanitizedQuery: {},
		};

		await patchHandler(req, { locals: {} }, next);

		expect(assessProposedLicenseChange).toHaveBeenCalledWith({
			accountability: null,
			licenseKey: 'DIR-ABCDE-ABCD2-ABCD3-ABCD4-ABCD5',
			schema: { collections: {}, relations: [] },
		});

		expect(applyLicense).not.toHaveBeenCalled();

		const error = next.mock.calls[0]?.[0];
		expect(error).toBeInstanceOf(Error);
		expect(error.code).toBe(LICENSE_CHANGE_BLOCKED);
		expect(error.extensions.assessment.compliant).toBe(false);
	});
});
