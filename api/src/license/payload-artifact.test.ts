import { InvalidLicenseTokenError } from '@directus/errors';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
	getLicensePayloadCacheTtl,
	readCacheTokenPayload,
	writeCacheTokenPayload,
} from '../utils/cache-token-payload.js';
import {
	isLicenseVerificationUnavailableError,
	LicenseVerificationUnavailableError,
	verify,
	verifyLocallyWithinGrace,
} from '../utils/verify-token.js';
import { getPayloadDisplayMetadata } from './display-metadata.js';
import { getEnvOfflinePayload } from './env.js';
import {
	isPayloadOutsideGrace,
	isSnapshotPayloadUsable,
	resolveStoredLicensePayload,
	shouldRefreshSnapshotPayload,
} from './payload-artifact.js';
import { getLicenseToken } from './storage.js';
import type { LicenseGateSnapshot, LicenseTokenPayload } from './types.js';

vi.mock('../utils/cache-token-payload.js', () => ({
	getLicensePayloadCacheTtl: vi.fn(),
	readCacheTokenPayload: vi.fn(),
	writeCacheTokenPayload: vi.fn(),
}));

vi.mock('../utils/verify-token.js', () => ({
	verify: vi.fn(),
	verifyLocallyWithinGrace: vi.fn(),
	LicenseVerificationUnavailableError: class LicenseVerificationUnavailableError extends Error {},
	isLicenseVerificationUnavailableError: vi.fn(
		(error: unknown) => error instanceof (globalThis as any).LicenseVerificationUnavailableErrorClass,
	),
}));

vi.mock('./display-metadata.js', () => ({
	getPayloadDisplayMetadata: vi.fn((payload) =>
		payload
			? {
					status: payload.metadata.status,
					plan: payload.metadata.plan,
					project_id: payload.metadata.project_id,
					public_url: payload.metadata.public_url,
					is_oig: payload.metadata.is_oig,
					refresh_interval: payload.metadata.refresh_interval,
					grace_period: payload.metadata.grace_period,
					expires_at: payload.metadata.expires_at,
					renews_at: payload.metadata.renews_at,
					addons: payload.metadata.addons,
				}
			: null,
	),
}));

vi.mock('./env.js', () => ({
	getEnvOfflinePayload: vi.fn(),
}));

vi.mock('./storage.js', () => ({
	getLicenseToken: vi.fn(),
}));

const mockedGetLicensePayloadCacheTtl = vi.mocked(getLicensePayloadCacheTtl);
const mockedReadCacheTokenPayload = vi.mocked(readCacheTokenPayload);
const mockedWriteCacheTokenPayload = vi.mocked(writeCacheTokenPayload);
const mockedVerify = vi.mocked(verify);
const mockedVerifyLocallyWithinGrace = vi.mocked(verifyLocallyWithinGrace);
const mockedIsLicenseVerificationUnavailableError = vi.mocked(isLicenseVerificationUnavailableError);
const mockedGetPayloadDisplayMetadata = vi.mocked(getPayloadDisplayMetadata);
const mockedGetEnvOfflinePayload = vi.mocked(getEnvOfflinePayload);
const mockedGetLicenseToken = vi.mocked(getLicenseToken);

function getPayload(overrides?: Partial<LicenseTokenPayload>): LicenseTokenPayload {
	return {
		iat: 1_700_000_000,
		exp: 4_000_000_000,
		metadata: {
			id: 'license-id',
			status: 'active',
			plan: 'team',
			project_id: 'project-id',
			public_url: 'https://example.com',
			is_oig: false,
			applicant_id: null,
			refresh_interval: 3600,
			grace_period: 60,
			expires_at: null,
			renews_at: null,
			addons: [],
			entitlements: {},
		},
		...overrides,
	};
}

function getSnapshot(overrides?: Partial<LicenseGateSnapshot>): LicenseGateSnapshot {
	return {
		hasStoredLicenseKey: true,
		durableStatus: 'active',
		terminal: null,
		graceOn: null,
		payloadState: 'valid',
		payload: getPayload(),
		displayMetadata: null,
		payloadStatus: 'active',
		tokenExpiresAt: 4_000_000_000,
		gracePeriod: 60,
		...overrides,
	};
}

afterEach(() => {
	vi.clearAllMocks();

	mockedIsLicenseVerificationUnavailableError.mockImplementation(
		(error: unknown) => error instanceof LicenseVerificationUnavailableError,
	);

	mockedGetLicensePayloadCacheTtl.mockReturnValue(3600);

	mockedGetPayloadDisplayMetadata.mockImplementation((payload) =>
		payload
			? {
					status: payload.metadata.status,
					plan: payload.metadata.plan,
					project_id: payload.metadata.project_id,
					public_url: payload.metadata.public_url,
					is_oig: payload.metadata.is_oig,
					refresh_interval: payload.metadata.refresh_interval,
					grace_period: payload.metadata.grace_period,
					expires_at: payload.metadata.expires_at,
					renews_at: payload.metadata.renews_at,
					addons: payload.metadata.addons,
				}
			: null,
	);
});

describe('payload-artifact helpers', () => {
	test('reports payloads outside grace', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-20T12:00:00.000Z'));

		expect(
			isPayloadOutsideGrace(
				getPayload({
					exp: Math.floor(Date.parse('2026-04-20T11:58:00.000Z') / 1000),
					metadata: {
						...getPayload().metadata,
						grace_period: 60,
					},
				}),
			),
		).toBe(true);

		expect(
			isPayloadOutsideGrace(
				getPayload({
					exp: Math.floor(Date.parse('2026-04-20T11:59:30.000Z') / 1000),
					metadata: {
						...getPayload().metadata,
						grace_period: 60,
					},
				}),
			),
		).toBe(false);

		vi.useRealTimers();
	});

	test('derives snapshot usability and refresh need from the same grace rule', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-20T12:00:00.000Z'));

		const staleSnapshot = getSnapshot({
			payload: getPayload({
				exp: Math.floor(Date.parse('2026-04-20T11:58:00.000Z') / 1000),
			}),
			tokenExpiresAt: Math.floor(Date.parse('2026-04-20T11:58:00.000Z') / 1000),
		});

		expect(isSnapshotPayloadUsable(staleSnapshot)).toBe(false);
		expect(shouldRefreshSnapshotPayload(staleSnapshot)).toBe(true);
		expect(shouldRefreshSnapshotPayload(getSnapshot({ payloadState: 'invalid', payload: null }))).toBe(false);

		vi.useRealTimers();
	});
});

describe('resolveStoredLicensePayload', () => {
	test('returns valid and writes cache on successful verification', async () => {
		const payload = getPayload();

		mockedGetEnvOfflinePayload.mockResolvedValue(undefined);
		mockedGetLicenseToken.mockResolvedValue('stored-token');
		mockedVerify.mockResolvedValue(payload);

		await expect(resolveStoredLicensePayload()).resolves.toMatchObject({
			state: 'valid',
			payload,
		});

		expect(mockedWriteCacheTokenPayload).toHaveBeenCalledWith(payload, 3600);
	});

	test('returns missing when no stored token exists', async () => {
		mockedGetEnvOfflinePayload.mockResolvedValue(undefined);
		mockedGetLicenseToken.mockResolvedValue(undefined);

		await expect(resolveStoredLicensePayload()).resolves.toEqual({
			state: 'missing',
			payload: null,
			displayMetadata: null,
		});
	});

	test('returns retained on transient verification failure when prior verified snapshot payload is still usable', async () => {
		const payload = getPayload();

		mockedGetEnvOfflinePayload.mockResolvedValue(undefined);
		mockedGetLicenseToken.mockResolvedValue('stored-token');
		mockedVerify.mockRejectedValue(new LicenseVerificationUnavailableError('jwks unavailable'));

		await expect(
			resolveStoredLicensePayload({
				previousSnapshot: getSnapshot({
					payloadState: 'valid',
					payload,
					tokenExpiresAt: payload.exp ?? null,
					gracePeriod: payload.metadata.grace_period,
				}),
			}),
		).resolves.toMatchObject({
			state: 'retained',
			payload,
		});

		expect(mockedReadCacheTokenPayload).not.toHaveBeenCalled();
	});

	test('returns invalid on cold start when transient verification fails without a prior verified artifact', async () => {
		mockedGetEnvOfflinePayload.mockResolvedValue(undefined);
		mockedGetLicenseToken.mockResolvedValue('stored-token');
		mockedVerify.mockRejectedValue(new LicenseVerificationUnavailableError('jwks unavailable'));
		mockedReadCacheTokenPayload.mockResolvedValue(undefined);

		await expect(resolveStoredLicensePayload()).resolves.toEqual({
			state: 'invalid',
			payload: null,
			displayMetadata: null,
		});
	});

	test('forces invalid when the only prior verified artifact is past grace', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-20T12:00:00.000Z'));

		const expiredPayload = getPayload({
			exp: Math.floor(Date.parse('2026-04-20T11:58:00.000Z') / 1000),
			metadata: {
				...getPayload().metadata,
				grace_period: 60,
			},
		});

		mockedGetEnvOfflinePayload.mockResolvedValue(undefined);
		mockedGetLicenseToken.mockResolvedValue('stored-token');
		mockedVerify.mockRejectedValue(new LicenseVerificationUnavailableError('jwks unavailable'));
		mockedReadCacheTokenPayload.mockResolvedValue(expiredPayload);

		await expect(resolveStoredLicensePayload()).resolves.toEqual({
			state: 'invalid',
			payload: null,
			displayMetadata: null,
		});

		vi.useRealTimers();
	});

	test('returns valid when strict local verification fails but grace-aware local verification succeeds', async () => {
		const payload = getPayload({
			exp: Math.floor(Date.parse('2026-04-20T11:59:30.000Z') / 1000),
		});

		mockedGetEnvOfflinePayload.mockResolvedValue(undefined);
		mockedGetLicenseToken.mockResolvedValue('stored-token');
		mockedVerify.mockRejectedValue(new InvalidLicenseTokenError({ reason: 'expired' }));
		mockedVerifyLocallyWithinGrace.mockResolvedValue(payload);

		await expect(resolveStoredLicensePayload({ mode: 'local' })).resolves.toMatchObject({
			state: 'valid',
			payload,
		});

		expect(mockedVerify).toHaveBeenCalledWith('stored-token', { mode: 'local' });
		expect(mockedVerifyLocallyWithinGrace).toHaveBeenCalledWith('stored-token');
		expect(mockedWriteCacheTokenPayload).toHaveBeenCalledWith(payload, 3600);
	});

	test('returns invalid for local token integrity failures when grace bridge also fails', async () => {
		mockedGetEnvOfflinePayload.mockResolvedValue(undefined);
		mockedGetLicenseToken.mockResolvedValue('stored-token');
		mockedVerify.mockRejectedValue(new InvalidLicenseTokenError({ reason: 'bad signature' }));
		mockedVerifyLocallyWithinGrace.mockRejectedValue(new InvalidLicenseTokenError({ reason: 'bad signature' }));

		await expect(resolveStoredLicensePayload()).resolves.toEqual({
			state: 'invalid',
			payload: null,
			displayMetadata: null,
		});
	});
});
