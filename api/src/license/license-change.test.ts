import { InvalidPayloadError } from '@directus/errors';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { applyProposedLicenseRemediation, assessProposedLicenseChange } from './license-change.js';

const { checkLicenseMock, assessMock, applyMock, serviceCtor } = vi.hoisted(() => ({
	checkLicenseMock: vi.fn(),
	assessMock: vi.fn(),
	applyMock: vi.fn(),
	serviceCtor: vi.fn(),
}));

vi.mock('./service.js', () => ({
	checkLicense: checkLicenseMock,
}));

vi.mock('../services/license-deactivation.js', () => ({
	LicenseDeactivationService: serviceCtor.mockImplementation(() => ({
		assess: assessMock,
		apply: applyMock,
	})),
}));

describe('license-change helpers', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test('assesses a proposed license using license_change target mode', async () => {
		checkLicenseMock.mockResolvedValue({
			valid: true,
			entitlements: {
				collections: { limit: 10 },
				seats: { limit: 3 },
				sso_enabled: false,
			},
		});

		assessMock.mockResolvedValue({ compliant: true, target_mode: 'license_change', sections: [] });

		await assessProposedLicenseChange({
			accountability: { admin: true } as any,
			licenseKey: 'proposed-key',
			schema: {} as any,
		});

		expect(serviceCtor).toHaveBeenCalledWith(
			expect.objectContaining({
				targetMode: 'license_change',
				targetEntitlements: expect.objectContaining({
					collections: { limit: 10 },
					seats: { limit: 3 },
					sso_enabled: false,
				}),
			}),
		);

		expect(assessMock).toHaveBeenCalledOnce();
	});

	test('rejects an invalid proposed license key', async () => {
		checkLicenseMock.mockResolvedValue({
			valid: false,
			entitlements: {},
		});

		await expect(
			assessProposedLicenseChange({
				accountability: { admin: true } as any,
				licenseKey: 'invalid-key',
				schema: {} as any,
			}),
		).rejects.toBeInstanceOf(InvalidPayloadError);

		expect(serviceCtor).not.toHaveBeenCalled();
	});

	test('applies proposed license remediation without persisting the key', async () => {
		checkLicenseMock.mockResolvedValue({
			valid: true,
			entitlements: {
				collections: { limit: 10 },
				seats: { limit: 3 },
				sso_enabled: false,
			},
		});

		applyMock.mockResolvedValue({ applied: true, compliant: true, target_mode: 'license_change', sections: [] });

		await applyProposedLicenseRemediation({
			accountability: { admin: true } as any,
			licenseKey: 'proposed-key',
			payload: {
				collections: ['posts'],
			},
			schema: {} as any,
		});

		expect(applyMock).toHaveBeenCalledWith({
			collections: ['posts'],
		});
	});
});
