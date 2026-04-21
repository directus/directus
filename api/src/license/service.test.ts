import { beforeEach, describe, expect, test, vi } from 'vitest';

const requestLicenseService = vi.fn();
const resolveProjectId = vi.fn();
const normalizeLicenseKey = vi.fn();

vi.mock('./request.js', () => ({
	requestLicenseService,
}));

vi.mock('./license-context.js', () => ({
	normalizeLicenseKey,
	normalizeOptionalLicenseKey: vi.fn(),
	resolveProjectId,
	resolvePublicUrl: vi.fn((value?: string) => value ?? 'https://example.com'),
	hashLicenseKey: vi.fn(),
}));

describe('license service deactivate request', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		resolveProjectId.mockResolvedValue('project-1');
		normalizeLicenseKey.mockImplementation((value: string) => `normalized:${value}`);
		requestLicenseService.mockResolvedValue({ deactivated: true });
	});

	test('requires exactly one credential', async () => {
		const { deactivateLicense } = await import('./service.js');

		await expect(
			deactivateLicense({
				projectId: 'project-1',
				licenseKey: 'dir-abc',
				licenseToken: 'token',
			}),
		).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });

		await expect(
			deactivateLicense({
				projectId: 'project-1',
			}),
		).rejects.toMatchObject({ code: 'INVALID_PAYLOAD' });

		expect(requestLicenseService).not.toHaveBeenCalled();
	});

	test('prefers license_key flow when only key is supplied', async () => {
		const { deactivateLicense } = await import('./service.js');

		await deactivateLicense({
			projectId: 'project-1',
			licenseKey: 'dir-abc',
		});

		expect(requestLicenseService).toHaveBeenCalledWith('POST', '/api/licenses/deactivate', {
			project_id: 'project-1',
			license_key: 'normalized:dir-abc',
		});
	});

	test('supports token-based flow when only token is supplied', async () => {
		const { deactivateLicense } = await import('./service.js');

		await deactivateLicense({
			projectId: 'project-1',
			licenseToken: '  token-value  ',
		});

		expect(requestLicenseService).toHaveBeenCalledWith('POST', '/api/licenses/deactivate', {
			project_id: 'project-1',
			license_token: 'token-value',
		});
	});
});
