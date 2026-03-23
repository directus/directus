import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mockNodeTracerProvider = vi.fn();
const mockBraintrustSpanProcessor = vi.fn();

vi.mock('@opentelemetry/sdk-trace-node', () => ({
	NodeTracerProvider: mockNodeTracerProvider,
}));

vi.mock('@braintrust/otel', () => ({
	BraintrustSpanProcessor: mockBraintrustSpanProcessor,
}));

describe('initBraintrust', () => {
	const originalEnv = { ...process.env };
	const mockGetTracer = vi.fn().mockReturnValue('tracer-instance');
	const mockShutdown = vi.fn().mockResolvedValue(undefined);

	beforeEach(() => {
		mockNodeTracerProvider.mockImplementation(() => ({
			getTracer: mockGetTracer,
			shutdown: mockShutdown,
		}));
	});

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.clearAllMocks();
	});

	test('returns state with recordIO from env', async () => {
		const { initBraintrust } = await import('./braintrust.js');

		const env = {
			BRAINTRUST_API_KEY: 'bt-key',
			BRAINTRUST_PROJECT_NAME: 'proj',
			BRAINTRUST_API_URL: '',
			AI_TELEMETRY_RECORD_IO: true,
		} as any;

		const state = await initBraintrust(env);

		expect(state.recordIO).toBe(true);
		expect(state.tracerProvider).toBeDefined();
	});

	test('recordIO is false when AI_TELEMETRY_RECORD_IO is not true', async () => {
		const { initBraintrust } = await import('./braintrust.js');

		const env = {
			BRAINTRUST_API_KEY: 'bt-key',
			BRAINTRUST_PROJECT_NAME: 'proj',
			BRAINTRUST_API_URL: '',
			AI_TELEMETRY_RECORD_IO: false,
		} as any;

		const state = await initBraintrust(env);

		expect(state.recordIO).toBe(false);
	});
});
