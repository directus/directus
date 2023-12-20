import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useEnv } from '../../env.js';
import { type TelemetryReport } from '../types/report.js';
import { sendReport } from './send-report.js';

vi.mock('../../env.js');

beforeEach(() => {
	vi.spyOn(global, 'fetch');
});

afterEach(() => {
	vi.clearAllMocks();
	vi.mocked(global.fetch).mockReset();
});

test('Posts stringified report to configured ingress URL', async () => {
	const mockIngress = 'https://example.com';

	vi.mocked(useEnv).mockReturnValue({
		TELEMETRY_INGRESS: mockIngress,
	});

	const url = new URL('/metrics', mockIngress);

	const mockReport = {} as unknown as TelemetryReport;
	const reportStringified = JSON.stringify(mockReport);

	await sendReport(mockReport);

	expect(global.fetch).toHaveBeenCalledWith(url, {
		method: 'POST',
		body: reportStringified,
		headers: {},
	});
});

test('Sets optional authorization header based on configured auth var', async () => {
	const mockIngress = 'https://example.com';

	vi.mocked(useEnv).mockReturnValue({
		TELEMETRY_INGRESS: mockIngress,
		TELEMETRY_AUTHORIZATION: 'test-auth',
	});

	const url = new URL('/metrics', mockIngress);

	const mockReport = {} as unknown as TelemetryReport;
	const reportStringified = JSON.stringify(mockReport);

	await sendReport(mockReport);

	expect(global.fetch).toHaveBeenCalledWith(url, {
		method: 'POST',
		body: reportStringified,
		headers: {
			Authorization: 'test-auth',
		},
	});
});
