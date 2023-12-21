import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useEnv } from '../../env.js';
import { type TelemetryReport } from '../types/report.js';
import { sendReport } from './send-report.js';

vi.mock('../../env.js');

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

	expect(sendReport(mockReport)).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: [503] test-error]`);
});
