import { AxiosError } from 'axios';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('jose', () => ({
	decodeJwt: vi.fn(() => ({
		exp: 1_700_000_000,
		metadata: {
			grace_period: 3600,
		},
	})),
	decodeProtectedHeader: vi.fn(() => ({ kid: 'remote-kid' })),
	importJWK: vi.fn().mockResolvedValue('crypto-key'),
	jwtVerify: vi.fn().mockResolvedValue({
		payload: {
			iat: 1_700_000_000,
			metadata: {
				refresh_interval: 3600,
			},
		},
	}),
}));

vi.mock('../license/request.js', () => ({
	getLicenseClient: vi.fn(() => ({
		get: vi.fn(),
	})),
}));

const jose = await import('jose');
const { getLicenseClient } = await import('../license/request.js');
const { LicenseVerificationUnavailableError, verify, verifyLocallyWithinGrace } = await import('./verify-token.js');

const mockedGetLicenseClient = vi.mocked(getLicenseClient);

describe('verify token', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		mockedGetLicenseClient.mockReturnValue({
			get: vi.fn().mockResolvedValue({
				data: {
					keys: [{ kid: 'remote-kid', alg: 'EdDSA' }],
				},
			}),
		} as any);
	});

	test('uses fresh JWKS lookup in remote mode', async () => {
		await verify('token');

		expect(mockedGetLicenseClient).toHaveBeenCalled();
	});

	test('skips network JWKS lookup in local mode', async () => {
		const decodeProtectedHeader = vi.mocked(jose.decodeProtectedHeader);
		decodeProtectedHeader.mockReturnValue({ kid: '9c884d23cdb155ca' } as any);

		await verify('token', { mode: 'local' });

		expect(mockedGetLicenseClient).not.toHaveBeenCalled();
	});

	test('treats transient JWKS failures plus unknown kid as verification unavailable', async () => {
		const transientError = new AxiosError('service unavailable', undefined, undefined, undefined, {
			status: 503,
			statusText: 'Service Unavailable',
			headers: {},
			config: {} as any,
			data: {
				code: 'SERVICE_UNAVAILABLE',
			},
		});

		mockedGetLicenseClient.mockReturnValue({
			get: vi.fn().mockRejectedValue(transientError),
		} as any);

		const decodeProtectedHeader = vi.mocked(jose.decodeProtectedHeader);
		decodeProtectedHeader.mockReturnValue({ kid: 'different-kid' } as any);

		await expect(verify('token')).rejects.toBeInstanceOf(LicenseVerificationUnavailableError);
	});

	test('verifies expired local tokens within grace without using the network', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-07T12:00:00.000Z'));

		const decodeProtectedHeader = vi.mocked(jose.decodeProtectedHeader);
		decodeProtectedHeader.mockReturnValue({ kid: '9c884d23cdb155ca' } as any);

		const decodeJwt = vi.mocked(jose.decodeJwt);

		decodeJwt.mockReturnValue({
			exp: Math.floor(Date.parse('2026-04-06T12:00:00.000Z') / 1000),
			metadata: {
				grace_period: 2 * 24 * 60 * 60,
			},
		} as any);

		await verifyLocallyWithinGrace('token');

		expect(mockedGetLicenseClient).not.toHaveBeenCalled();

		expect(vi.mocked(jose.jwtVerify)).toHaveBeenCalledWith(
			'token',
			'crypto-key',
			expect.objectContaining({
				currentDate: new Date('2026-04-06T11:59:59.000Z'),
			}),
		);

		vi.useRealTimers();
	});

	test('rejects expired local tokens after grace has elapsed', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-10T12:00:00.000Z'));

		const decodeJwt = vi.mocked(jose.decodeJwt);

		decodeJwt.mockReturnValue({
			exp: Math.floor(Date.parse('2026-04-06T12:00:00.000Z') / 1000),
			metadata: {
				grace_period: 2 * 24 * 60 * 60,
			},
		} as any);

		await expect(verifyLocallyWithinGrace('token')).rejects.toMatchObject({
			code: 'INVALID_LICENSE_TOKEN',
		});

		vi.useRealTimers();
	});
});
