import { InvalidLicenseTokenError } from '@directus/errors';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { verify, verifyLocallyWithinGrace } from '../utils/verify-token.js';
import { getEnvOfflinePayload } from './env.js';
import { getLicensePayload, getLocalLicensePayload } from './get-license-payload.js';
import { getLicenseToken } from './storage.js';

vi.mock('../utils/cache-token-payload.js', () => ({
	getLicensePayloadCacheTtl: vi.fn().mockReturnValue(60),
	readCacheTokenPayload: vi.fn().mockResolvedValue(undefined),
	writeCacheTokenPayload: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../utils/verify-token.js', () => ({
	verify: vi.fn(),
	verifyLocallyWithinGrace: vi.fn(),
}));

vi.mock('./env.js', () => ({
	getEnvOfflinePayload: vi.fn(),
}));

vi.mock('./storage.js', () => ({
	getLicenseToken: vi.fn(),
}));

const mockedVerify = vi.mocked(verify);
const mockedVerifyLocallyWithinGrace = vi.mocked(verifyLocallyWithinGrace);
const mockedGetEnvOfflinePayload = vi.mocked(getEnvOfflinePayload);
const mockedGetLicenseToken = vi.mocked(getLicenseToken);

describe('stored license payload verification mode', () => {
	beforeEach(() => {
		mockedGetEnvOfflinePayload.mockResolvedValue(undefined);
		mockedGetLicenseToken.mockResolvedValue('stored-token');

		mockedVerify.mockResolvedValue({
			metadata: {
				project_id: 'project_1',
				grace_period: 0,
			},
		} as never);

		mockedVerifyLocallyWithinGrace.mockResolvedValue({
			exp: 1_700_000_000,
			metadata: {
				project_id: 'project_1',
				grace_period: 0,
				status: 'active',
			},
		} as never);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	test('kept remote/default verification for authoritative payload loads', async () => {
		await getLicensePayload();

		expect(mockedVerify).toHaveBeenCalledWith('stored-token', undefined);
	});

	test('used local verification when reading the locally-restored payload path', async () => {
		await getLocalLicensePayload();

		expect(mockedVerify).toHaveBeenCalledWith('stored-token', { mode: 'local' });
	});

	test('treated invalid or expired stored tokens as missing on the local payload path', async () => {
		mockedVerify.mockRejectedValueOnce(new InvalidLicenseTokenError({ reason: 'expired stored token' }));

		await expect(getLocalLicensePayload()).resolves.toBeUndefined();
	});

	test('used the grace-aware local path when verification failed on exp but grace remained', async () => {
		mockedVerify.mockRejectedValueOnce(new Error('"exp" claim timestamp check failed'));

		const payload = {
			exp: 1_700_000_000,
			metadata: {
				project_id: 'project_1',
				grace_period: 60,
				status: 'expired',
			},
		} as never;

		mockedVerifyLocallyWithinGrace.mockResolvedValueOnce(payload);

		await expect(getLocalLicensePayload()).resolves.toBe(payload);
		expect(mockedVerifyLocallyWithinGrace).toHaveBeenCalledWith('stored-token');
	});

	test('treated expired local tokens outside grace as missing', async () => {
		mockedVerify.mockRejectedValueOnce(new Error('"exp" claim timestamp check failed'));

		mockedVerifyLocallyWithinGrace.mockRejectedValueOnce(
			new InvalidLicenseTokenError({ reason: 'Token is outside the local grace window' }),
		);

		await expect(getLocalLicensePayload()).resolves.toBeUndefined();
	});

	test('kept unexpected verification errors visible on the local payload path', async () => {
		mockedVerify.mockRejectedValueOnce(new Error('unexpected verification failure'));

		await expect(getLocalLicensePayload()).rejects.toMatchObject({
			code: 'INVALID_LICENSE_TOKEN',
			cause: expect.objectContaining({
				message: 'unexpected verification failure',
			}),
		});
	});

	test('kept the authoritative payload path strict for invalid stored tokens', async () => {
		mockedVerify.mockRejectedValueOnce(new InvalidLicenseTokenError({ reason: 'expired stored token' }));

		await expect(getLicensePayload()).rejects.toMatchObject({
			code: 'INVALID_LICENSE_TOKEN',
		});
	});
});
