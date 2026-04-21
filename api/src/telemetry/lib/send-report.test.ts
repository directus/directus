import { useEnv } from '@directus/env';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getCurrentLicenseBinding } from '../../license/binding.js';
import { readLicenseGateSnapshot } from '../../license/cache-license-gate-snapshot.js';
import { getLocalLicensePayload } from '../../license/get-license-payload.js';
import { type TelemetryReport } from '../types/report.js';
import { sendReport } from './send-report.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		TELEMETRY_URL: 'https://example.com',
		COMPLIANCE_URL: 'https://example.com',
		CACHE_NAMESPACE: 'test',
		CACHE_TTL: '1m',
		CACHE_SYSTEM_TTL: '1m',
		CACHE_DEPLOYMENT_TTL: '5s',
		CACHE_STORE: 'memory',
		CACHE_ENABLED: false,
		CACHE_SCHEMA_FREEZE_ENABLED: false,
		REDIS_ENABLED: false,
	}),
}));

vi.mock('../../license/binding.js', () => ({
	getCurrentLicenseBinding: vi.fn().mockResolvedValue({ terminal: null, durableStatus: 'active' }),
}));

vi.mock('../../license/cache-license-gate-snapshot.js', () => ({
	readLicenseGateSnapshot: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../license/get-license-payload.js', () => ({
	getLocalLicensePayload: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: vi.fn() }));
	vi.mocked(readLicenseGateSnapshot).mockResolvedValue(undefined);
	vi.mocked(getCurrentLicenseBinding).mockResolvedValue({ terminal: null, durableStatus: 'active' } as any);
	vi.mocked(getLocalLicensePayload).mockResolvedValue(undefined);

	vi.mocked(useEnv).mockReturnValue({
		TELEMETRY_URL: 'https://example.com',
		COMPLIANCE_URL: 'https://example.com',
		CACHE_NAMESPACE: 'test',
		CACHE_TTL: '1m',
		CACHE_SYSTEM_TTL: '1m',
		CACHE_DEPLOYMENT_TTL: '5s',
		CACHE_STORE: 'memory',
		CACHE_ENABLED: false,
		CACHE_SCHEMA_FREEZE_ENABLED: false,
		REDIS_ENABLED: false,
	} as any);
});

afterEach(() => {
	vi.clearAllMocks();
	vi.unstubAllGlobals();
});

test('Posts stringified report to configured ingress URL', async () => {
	const mockIngress = 'https://example.com';

	vi.mocked(useEnv).mockReturnValue({
		TELEMETRY_URL: mockIngress,
	});

	const url = new URL('/v1/metrics', mockIngress);

	const mockReport = {} as unknown as TelemetryReport;
	const reportStringified = JSON.stringify(mockReport);

	await sendReport(mockReport);

	expect(global.fetch).toHaveBeenCalledWith(url, {
		method: 'POST',
		body: reportStringified,
		headers: {
			'Content-Type': 'application/json',
		},
	});
});

test('Sets optional authorization header based on configured auth var', async () => {
	const mockIngress = 'https://example.com';

	vi.mocked(useEnv).mockReturnValue({
		TELEMETRY_URL: mockIngress,
		TELEMETRY_AUTHORIZATION: 'test-auth',
	});

	const url = new URL('/v1/metrics', mockIngress);

	const mockReport = {} as unknown as TelemetryReport;
	const reportStringified = JSON.stringify(mockReport);

	await sendReport(mockReport);

	expect(global.fetch).toHaveBeenCalledWith(url, {
		method: 'POST',
		body: reportStringified,
		headers: {
			Authorization: 'test-auth',
			'Content-Type': 'application/json',
		},
	});
});

test('Throws error if post was not successful', async () => {
	vi.mocked(global.fetch).mockResolvedValue({
		ok: false,
		text: vi.fn().mockResolvedValue('test-error'),
		status: 503,
	} as unknown as Response);

	const mockIngress = 'https://example.com';

	vi.mocked(useEnv).mockReturnValue({
		TELEMETRY_URL: mockIngress,
		TELEMETRY_AUTHORIZATION: 'test-auth',
	});

	const mockReport = {} as unknown as TelemetryReport;

	await expect(sendReport(mockReport)).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: [503] test-error]`);
});

test('Sends to /v1/owner on owner payload', async () => {
	const mockIngress = 'https://example.com';

	vi.mocked(useEnv).mockReturnValue({
		COMPLIANCE_URL: mockIngress,
		TELEMETRY_AUTHORIZATION: 'test-auth',
	});

	await sendReport({
		project_owner: '',
		version: '',
		org_name: '',
		product_updates: false,
		project_id: '',
		project_usage: 'personal',
	});

	expect(vi.mocked(global.fetch)).toHaveBeenCalled();
	expect(vi.mocked(global.fetch).mock.calls[0]![0].toString()).toEqual('https://example.com/v1/owner');
});

test('Skips sending telemetry metrics when snapshot entitlements opt out of analytics', async () => {
	vi.mocked(useEnv).mockReturnValue({
		TELEMETRY_URL: 'https://example.com',
	});

	vi.mocked(readLicenseGateSnapshot).mockResolvedValue({
		terminal: null,
		durableStatus: 'active',
		payloadState: 'valid',
		payloadStatus: 'active',
		tokenExpiresAt: 1_900_000_000,
		gracePeriod: 0,
		payload: {
			exp: 1_900_000_000,
			metadata: {
				status: 'active',
				grace_period: 0,
				entitlements: {
					analytics_opt_out_enabled: true,
				},
			},
		},
	} as any);

	await sendReport({} as TelemetryReport);

	expect(global.fetch).not.toHaveBeenCalled();
});

test('Skips sending telemetry metrics when the local payload opts out and no snapshot is cached', async () => {
	vi.mocked(useEnv).mockReturnValue({
		TELEMETRY_URL: 'https://example.com',
	});

	vi.mocked(getLocalLicensePayload).mockResolvedValue({
		exp: 1_900_000_000,
		metadata: {
			status: 'active',
			grace_period: 0,
			entitlements: {
				analytics_opt_out_enabled: true,
			},
		},
	} as any);

	await sendReport({} as TelemetryReport);

	expect(global.fetch).not.toHaveBeenCalled();
});

test('Defaults to sending when license policy cannot be resolved', async () => {
	vi.mocked(useEnv).mockReturnValue({
		TELEMETRY_URL: 'https://example.com',
	});

	vi.mocked(readLicenseGateSnapshot).mockRejectedValueOnce(new Error('snapshot failed'));

	await sendReport({} as TelemetryReport);

	expect(global.fetch).toHaveBeenCalledOnce();
});
