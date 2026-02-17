import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { applyBraintrustEnv } from './braintrust.js';

const mockNodeTracerProvider = vi.fn();
const mockBraintrustSpanProcessor = vi.fn();

vi.mock('@opentelemetry/sdk-trace-node', () => ({
	NodeTracerProvider: mockNodeTracerProvider,
}));

vi.mock('@braintrust/otel', () => ({
	BraintrustSpanProcessor: mockBraintrustSpanProcessor,
}));

describe('applyBraintrustEnv', () => {
	const originalEnv = { ...process.env };

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.clearAllMocks();
	});

	test('sets BRAINTRUST_API_KEY, BRAINTRUST_PROJECT_NAME, BRAINTRUST_API_URL on process.env', () => {
		const env = {
			BRAINTRUST_API_KEY: 'bt-key-test',
			BRAINTRUST_PROJECT_NAME: 'my-project',
			BRAINTRUST_API_URL: 'https://braintrust.example.com',
		} as any;

		applyBraintrustEnv(env);

		expect(process.env['BRAINTRUST_API_KEY']).toBe('bt-key-test');
		expect(process.env['BRAINTRUST_PROJECT_NAME']).toBe('my-project');
		expect(process.env['BRAINTRUST_API_URL']).toBe('https://braintrust.example.com');
	});

	test('skips empty strings', () => {
		const env = {
			BRAINTRUST_API_KEY: '',
			BRAINTRUST_PROJECT_NAME: '',
			BRAINTRUST_API_URL: '',
		} as any;

		delete process.env['BRAINTRUST_API_KEY'];
		delete process.env['BRAINTRUST_PROJECT_NAME'];
		delete process.env['BRAINTRUST_API_URL'];

		applyBraintrustEnv(env);

		expect(process.env['BRAINTRUST_API_KEY']).toBeUndefined();
		expect(process.env['BRAINTRUST_PROJECT_NAME']).toBeUndefined();
		expect(process.env['BRAINTRUST_API_URL']).toBeUndefined();
	});
});

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

	test('creates NodeTracerProvider with BraintrustSpanProcessor', async () => {
		const { initBraintrust } = await import('./braintrust.js');

		const env = {
			BRAINTRUST_API_KEY: 'bt-key',
			BRAINTRUST_PROJECT_NAME: 'proj',
			BRAINTRUST_API_URL: '',
			AI_TELEMETRY_RECORD_IO: false,
		} as any;

		await initBraintrust(env);

		expect(mockBraintrustSpanProcessor).toHaveBeenCalledWith({ filterAISpans: true });
		expect(mockNodeTracerProvider).toHaveBeenCalled();
	});
});
