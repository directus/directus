import { sendReport } from './send-report.js';
import { type TelemetryReport } from '../types/report.js';
import { useEnv } from '@directus/env';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

vi.mock('@directus/env');

beforeEach(() => {
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: vi.fn() }));
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
