import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getCacheValue, setCacheValue } from '../cache.js';
import {
	clearLicenseGateSnapshot,
	readLicenseGateSnapshot,
	refreshLicenseGateSnapshot,
} from './cache-license-gate-snapshot.js';
import { resolveStoredLicensePayload } from './payload-artifact.js';
import { readLicenseState } from './storage.js';
import type { LicenseGateSnapshot } from './types.js';

let cachedSnapshot: LicenseGateSnapshot | undefined;

const deleteSnapshot = vi.fn(async () => {
	cachedSnapshot = undefined;
});

vi.mock('../cache.js', () => ({
	getCache: vi.fn(() => ({
		systemCache: {
			delete: deleteSnapshot,
		},
	})),
	getCacheValue: vi.fn(async () => cachedSnapshot),
	setCacheValue: vi.fn(async (_cache, _key, value) => {
		cachedSnapshot = value as LicenseGateSnapshot;
	}),
}));

vi.mock('./storage.js', () => ({
	readLicenseState: vi.fn(),
}));

vi.mock('./payload-artifact.js', () => ({
	resolveStoredLicensePayload: vi.fn(),
}));

vi.mock('./display-metadata.js', () => ({
	getStoredLicenseDisplayMetadata: vi.fn(),
}));

const mockedReadLicenseState = vi.mocked(readLicenseState);
const mockedResolveStoredLicensePayload = vi.mocked(resolveStoredLicensePayload);
const { getStoredLicenseDisplayMetadata } = await import('./display-metadata.js');
const mockedGetStoredLicenseDisplayMetadata = vi.mocked(getStoredLicenseDisplayMetadata);
const mockedGetCacheValue = vi.mocked(getCacheValue);
const mockedSetCacheValue = vi.mocked(setCacheValue);

describe('cache-license-gate-snapshot', () => {
	beforeEach(() => {
		cachedSnapshot = undefined;
		deleteSnapshot.mockClear();
		vi.clearAllMocks();
	});

	afterEach(() => {
		cachedSnapshot = undefined;
	});

	test('reads and clears the cached snapshot', async () => {
		cachedSnapshot = {
			hasStoredLicenseKey: true,
			durableStatus: 'active',
			terminal: null,
			graceOn: null,
			payloadState: 'missing',
			payload: null,
			displayMetadata: null,
		};

		await expect(readLicenseGateSnapshot()).resolves.toEqual(cachedSnapshot);
		await clearLicenseGateSnapshot();
		await expect(readLicenseGateSnapshot()).resolves.toBeUndefined();
		expect(deleteSnapshot).toHaveBeenCalledOnce();
		expect(mockedGetCacheValue).toHaveBeenCalledTimes(2);
	});

	test('refreshes and caches a valid payload snapshot', async () => {
		mockedReadLicenseState.mockResolvedValue({
			license_key: 'encrypted-key',
			license_status: 'active',
			license_terminal_status: null,
			license_grace_on: null,
		});

		mockedResolveStoredLicensePayload.mockResolvedValue({
			state: 'valid',
			payload: {
				exp: 1_800_000_000,
				metadata: {
					status: 'active',
					grace_period: 10,
				},
			} as any,
			displayMetadata: {
				status: 'active',
				plan: 'team',
				project_id: 'project-id',
				public_url: 'https://example.com',
				is_oig: false,
				refresh_interval: 3600,
				grace_period: 10,
				expires_at: null,
				renews_at: null,
				addons: [],
			},
		});

		await expect(refreshLicenseGateSnapshot()).resolves.toEqual({
			hasStoredLicenseKey: true,
			durableStatus: 'active',
			terminal: null,
			graceOn: null,
			payloadState: 'valid',
			payload: {
				exp: 1_800_000_000,
				metadata: {
					status: 'active',
					grace_period: 10,
				},
			},
			displayMetadata: {
				status: 'active',
				plan: 'team',
				project_id: 'project-id',
				public_url: 'https://example.com',
				is_oig: false,
				refresh_interval: 3600,
				grace_period: 10,
				expires_at: null,
				renews_at: null,
				addons: [],
			},
			payloadStatus: 'active',
			tokenExpiresAt: 1_800_000_000,
			gracePeriod: 10,
		});

		expect(mockedSetCacheValue).toHaveBeenCalledOnce();

		expect(cachedSnapshot).toMatchObject({
			payloadState: 'valid',
			payloadStatus: 'active',
		});
	});

	test('marks invalid payloads in the cached snapshot', async () => {
		mockedReadLicenseState.mockResolvedValue({
			license_key: 'encrypted-key',
			license_status: 'active',
			license_terminal_status: null,
			license_grace_on: null,
		});

		mockedResolveStoredLicensePayload.mockResolvedValue({
			state: 'invalid',
			payload: null,
			displayMetadata: null,
		});

		await expect(refreshLicenseGateSnapshot()).resolves.toEqual({
			hasStoredLicenseKey: true,
			durableStatus: 'active',
			terminal: null,
			graceOn: null,
			payloadState: 'invalid',
			payload: null,
			displayMetadata: null,
			payloadStatus: undefined,
			tokenExpiresAt: null,
			gracePeriod: null,
		});

		expect(cachedSnapshot).toMatchObject({ payloadState: 'invalid' });
	});

	test('keeps a stale good cache when refresh fails', async () => {
		cachedSnapshot = {
			hasStoredLicenseKey: true,
			durableStatus: 'active',
			terminal: null,
			graceOn: null,
			payloadState: 'valid',
			payload: null,
			displayMetadata: null,
			payloadStatus: 'active',
			tokenExpiresAt: 1_800_000_000,
			gracePeriod: 0,
		};

		mockedReadLicenseState.mockRejectedValue(new Error('database unavailable'));

		await expect(refreshLicenseGateSnapshot()).rejects.toThrow('database unavailable');
		await expect(readLicenseGateSnapshot()).resolves.toEqual(cachedSnapshot);
		expect(mockedSetCacheValue).not.toHaveBeenCalled();
	});

	test('shares one in-flight refresh across concurrent callers on success', async () => {
		let releaseReadState: (() => void) | undefined;

		mockedReadLicenseState.mockImplementation(
			() =>
				new Promise((resolve) => {
					releaseReadState = () =>
						resolve({
							license_key: 'encrypted-key',
							license_status: 'active',
							license_terminal_status: null,
							license_grace_on: null,
						});
				}),
		);

		mockedResolveStoredLicensePayload.mockResolvedValue({
			state: 'missing',
			payload: null,
			displayMetadata: null,
		});

		const firstRefresh = refreshLicenseGateSnapshot();
		const secondRefresh = refreshLicenseGateSnapshot();

		await Promise.resolve();
		await Promise.resolve();

		releaseReadState?.();

		const [firstResult, secondResult] = await Promise.all([firstRefresh, secondRefresh]);

		expect(firstResult).toEqual(secondResult);
		expect(mockedReadLicenseState).toHaveBeenCalledTimes(1);
		expect(mockedResolveStoredLicensePayload).toHaveBeenCalledTimes(1);
	});

	test('hydrates stored display metadata when a terminal status exists without payload metadata', async () => {
		mockedReadLicenseState.mockResolvedValue({
			license_key: 'encrypted-key',
			license_status: 'inactive',
			license_terminal_status: 'expired',
			license_grace_on: null,
		});

		mockedResolveStoredLicensePayload.mockResolvedValue({
			state: 'missing',
			payload: null,
			displayMetadata: null,
		});

		mockedGetStoredLicenseDisplayMetadata.mockResolvedValue({
			status: 'expired',
			plan: 'team',
			project_id: 'project-id',
			public_url: 'https://example.com',
			is_oig: false,
			refresh_interval: 3600,
			grace_period: null,
			expires_at: null,
			renews_at: null,
			addons: [],
		} as any);

		await expect(refreshLicenseGateSnapshot()).resolves.toMatchObject({
			terminal: 'expired',
			displayMetadata: {
				status: 'expired',
			},
		});
	});
});
