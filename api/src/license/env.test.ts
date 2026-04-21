import { InvalidLicenseConfigError, InvalidLicenseTokenError } from '@directus/errors';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { verify } from '../utils/verify-token.js';
import { getEnvOfflinePayload, toEnvOfflineConfigError } from './env.js';

const { mockedUseEnv } = vi.hoisted(() => ({
	mockedUseEnv: vi.fn(() => ({})),
}));

vi.mock('@directus/env', () => ({
	useEnv: mockedUseEnv,
}));

vi.mock('../utils/verify-token.js', () => ({
	verify: vi.fn(),
}));

const mockedVerify = vi.mocked(verify);

describe('env offline token verification', () => {
	beforeEach(() => {
		mockedUseEnv.mockReturnValue({
			DIRECTUS_LICENSE_OFFLINE_TOKEN: 'offline-token',
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	test('verified offline tokens in local mode', async () => {
		mockedVerify.mockResolvedValue({
			metadata: {
				entitlements: {
					offline_enabled: true,
				},
				refresh_interval: 0,
			},
		} as never);

		await getEnvOfflinePayload();

		expect(mockedVerify).toHaveBeenCalledWith('offline-token', { mode: 'local' });
	});

	test('mapped invalid offline-token failures into config errors with the shared helper', () => {
		const tokenError = new InvalidLicenseTokenError({ reason: 'Token is not offline-enabled' });
		const configError = toEnvOfflineConfigError(tokenError);

		expect(configError).toBeInstanceOf(InvalidLicenseConfigError);
		expect(configError.extensions?.reason).toBe('DIRECTUS_LICENSE_OFFLINE_TOKEN is invalid or not offline-enabled');
		expect(configError.cause).toBe(tokenError);
	});
});
