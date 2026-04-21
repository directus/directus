import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const envState = vi.hoisted(() => ({
	LICENSE_VALIDATE_SCHEDULE: '0 0 * * * *',
	DIRECTUS_LICENSE_KEY: undefined as string | undefined,
	DIRECTUS_LICENSE_OFFLINE_TOKEN: undefined as string | undefined,
}));

vi.mock('@directus/env', () => ({
	useEnv: vi.fn(() => envState),
}));

vi.mock('../utils/schedule.js', () => ({
	scheduleSynchronizedJob: vi.fn(() => ({ stop: vi.fn().mockResolvedValue(undefined) })),
	scheduleSynchronizedJobAt: vi.fn(() => ({ stop: vi.fn().mockResolvedValue(undefined) })),
	validateCron: vi.fn((rule: string) => rule === '0 0 * * * *'),
}));

vi.mock('./binding.js', () => ({
	getCurrentLicenseBinding: vi.fn().mockResolvedValue({
		durableStatus: 'active',
		terminal: null,
	}),
}));

vi.mock('./cache-license-gate-snapshot.js', () => ({
	readLicenseGateSnapshot: vi.fn().mockResolvedValue(undefined),
	refreshLicenseGateSnapshot: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./env.js', () => ({
	isEnvOffline: vi.fn(() => false),
}));

vi.mock('./get-license-payload.js', () => ({
	getLocalLicensePayload: vi.fn(),
}));

vi.mock('./lifecycle.js', () => ({
	refreshLicense: vi.fn(),
}));

const { scheduleSynchronizedJob, scheduleSynchronizedJobAt } = await import('../utils/schedule.js');
const { getCurrentLicenseBinding } = await import('./binding.js');
const { readLicenseGateSnapshot, refreshLicenseGateSnapshot } = await import('./cache-license-gate-snapshot.js');
const { isEnvOffline } = await import('./env.js');
const { getLocalLicensePayload } = await import('./get-license-payload.js');
const { refreshLicense } = await import('./lifecycle.js');

const mockedScheduleSynchronizedJob = vi.mocked(scheduleSynchronizedJob);
const mockedScheduleSynchronizedJobAt = vi.mocked(scheduleSynchronizedJobAt);
const mockedGetCurrentLicenseBinding = vi.mocked(getCurrentLicenseBinding);
const mockedReadLicenseGateSnapshot = vi.mocked(readLicenseGateSnapshot);
const mockedRefreshLicenseGateSnapshot = vi.mocked(refreshLicenseGateSnapshot);
const mockedIsEnvOffline = vi.mocked(isEnvOffline);
const mockedGetLocalLicensePayload = vi.mocked(getLocalLicensePayload);
const mockedRefreshLicense = vi.mocked(refreshLicense);

const {
	getFallbackCronTime,
	getScheduledRefreshAt,
	initializeLicenseRefreshSchedule,
	isOfflineToken,
	isUsableRefreshInterval,
	recomputeLicenseRefreshSchedule,
	stopLicenseRefreshSchedule,
} = await import('./refresh-scheduler.js');

describe('refresh-scheduler', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		envState.DIRECTUS_LICENSE_KEY = undefined;
		envState.DIRECTUS_LICENSE_OFFLINE_TOKEN = undefined;
		mockedIsEnvOffline.mockReturnValue(false);

		mockedGetCurrentLicenseBinding.mockResolvedValue({
			durableStatus: 'active',
			terminal: null,
		} as any);

		mockedReadLicenseGateSnapshot.mockResolvedValue(undefined);
		mockedRefreshLicenseGateSnapshot.mockResolvedValue(undefined);
		mockedGetLocalLicensePayload.mockResolvedValue(null);
	});

	afterEach(async () => {
		await stopLicenseRefreshSchedule();
	});

	test('accepts positive refresh intervals up to the supported maximum', () => {
		expect(isUsableRefreshInterval(1)).toBe(true);
		expect(isUsableRefreshInterval(300)).toBe(true);
		expect(isUsableRefreshInterval(604800)).toBe(true);
		expect(isUsableRefreshInterval(0)).toBe(false);
		expect(isUsableRefreshInterval(604801)).toBe(false);
		expect(isUsableRefreshInterval(null)).toBe(false);
	});

	test('identifies offline tokens by refresh_interval=0', () => {
		expect(isOfflineToken({ metadata: { refresh_interval: 0 } } as any)).toBe(true);
		expect(isOfflineToken({ metadata: { refresh_interval: 3600 } } as any)).toBe(false);
	});

	test('anchors the next refresh time to token issuance time', () => {
		const scheduledAt = getScheduledRefreshAt({
			iat: 1_700_000_000,
			metadata: {
				refresh_interval: 3600,
			},
		} as any);

		expect(scheduledAt?.toISOString()).toBe(new Date((1_700_000_000 + 3600) * 1000).toISOString());
	});

	test('uses the configured cron fallback when no usable interval is available', async () => {
		await initializeLicenseRefreshSchedule();

		expect(getFallbackCronTime()).toBe('0 0 * * * *');
		expect(mockedScheduleSynchronizedJob).toHaveBeenCalledWith('license-check', '0 0 * * * *', expect.any(Function));
		expect(mockedScheduleSynchronizedJobAt).not.toHaveBeenCalled();
	});

	test('uses a one-shot synchronized refresh when a usable refresh interval is present in the snapshot', async () => {
		mockedReadLicenseGateSnapshot.mockResolvedValue({
			durableStatus: 'active',
			terminal: null,
			payloadState: 'valid',
			payload: {
				iat: 1_900_000_000,
				exp: 1_900_003_600,
				metadata: {
					status: 'active',
					grace_period: 0,
					refresh_interval: 3600,
				},
			},
		} as any);

		await recomputeLicenseRefreshSchedule();

		expect(mockedScheduleSynchronizedJobAt).toHaveBeenCalledWith(
			'license-check',
			new Date((1_900_000_000 + 3600) * 1000),
			expect.any(Function),
		);

		expect(mockedScheduleSynchronizedJob).not.toHaveBeenCalled();
	});

	test('does not schedule refresh for offline tokens', async () => {
		mockedReadLicenseGateSnapshot.mockResolvedValue({
			durableStatus: 'active',
			terminal: null,
			payloadState: 'valid',
			payload: {
				iat: 1_900_000_000,
				exp: 1_900_003_600,
				metadata: {
					status: 'active',
					grace_period: 0,
					refresh_interval: 0,
				},
			},
		} as any);

		await recomputeLicenseRefreshSchedule();

		expect(mockedScheduleSynchronizedJobAt).not.toHaveBeenCalled();
		expect(mockedScheduleSynchronizedJob).not.toHaveBeenCalled();
	});

	test('does not schedule or refresh when env offline mode is active', async () => {
		mockedIsEnvOffline.mockReturnValue(true);

		await recomputeLicenseRefreshSchedule();

		expect(mockedGetCurrentLicenseBinding).not.toHaveBeenCalled();
		expect(mockedScheduleSynchronizedJobAt).not.toHaveBeenCalled();
		expect(mockedScheduleSynchronizedJob).not.toHaveBeenCalled();
	});

	test('falls back to local payload lookup when the snapshot is missing', async () => {
		mockedGetLocalLicensePayload.mockResolvedValue({
			iat: 1_700_000_000,
			exp: 1_700_003_600,
			metadata: {
				status: 'active',
				grace_period: 0,
				refresh_interval: 3600,
			},
		} as any);

		await recomputeLicenseRefreshSchedule();

		expect(mockedGetLocalLicensePayload).toHaveBeenCalledTimes(1);
		expect(mockedScheduleSynchronizedJobAt).toHaveBeenCalled();
	});

	test('falls back to cron retry when one-shot refresh fails', async () => {
		mockedReadLicenseGateSnapshot.mockResolvedValue({
			durableStatus: 'active',
			terminal: null,
			payloadState: 'valid',
			payload: {
				iat: 1_900_000_000,
				exp: 1_900_003_600,
				metadata: {
					status: 'active',
					grace_period: 0,
					refresh_interval: 3600,
				},
			},
		} as any);

		mockedRefreshLicense.mockRejectedValueOnce(new Error('transient failure'));

		await recomputeLicenseRefreshSchedule();

		const scheduledCallback = mockedScheduleSynchronizedJobAt.mock.calls[0]?.[2];
		expect(scheduledCallback).toBeTypeOf('function');

		await scheduledCallback?.(new Date((1_900_000_000 + 3600) * 1000));

		expect(mockedRefreshLicense).toHaveBeenCalledWith({ mode: 'scheduled' });
		expect(mockedScheduleSynchronizedJob).toHaveBeenCalledWith('license-check', '0 0 * * * *', expect.any(Function));
	});

	test('uses cron fallback when terminal status is persisted on startup', async () => {
		mockedReadLicenseGateSnapshot.mockResolvedValue({
			durableStatus: 'active',
			terminal: 'canceled',
			payloadState: 'valid',
			payload: {
				iat: 1_900_000_000,
				exp: 1_900_003_600,
				metadata: {
					status: 'active',
					grace_period: 0,
					refresh_interval: 3600,
				},
			},
		} as any);

		await initializeLicenseRefreshSchedule();

		expect(mockedScheduleSynchronizedJob).toHaveBeenCalledWith('license-check', '0 0 * * * *', expect.any(Function));
		expect(mockedScheduleSynchronizedJobAt).not.toHaveBeenCalled();
	});
});
