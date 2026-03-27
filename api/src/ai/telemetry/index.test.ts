import { afterEach, beforeEach, describe, expect, test, vi } from 'vite-plus/test';

const mockEnv: Record<string, unknown> = {};
const mockLogger = { info: vi.fn(), warn: vi.fn() };
const mockInitLangfuse = vi.fn();
const mockInitBraintrust = vi.fn();

let initAITelemetry: (typeof import('./index.js'))['initAITelemetry'];
let getAITelemetryConfig: (typeof import('./index.js'))['getAITelemetryConfig'];
let shutdownAITelemetry: (typeof import('./index.js'))['shutdownAITelemetry'];

beforeEach(async () => {
	vi.resetModules();

	// Re-register mocks after resetModules
	vi.doMock('@directus/env', () => ({
		useEnv: vi.fn(() => mockEnv),
	}));

	vi.doMock('../../logger/index.js', () => ({
		useLogger: vi.fn(() => mockLogger),
	}));

	vi.doMock('./langfuse.js', () => ({
		initLangfuse: mockInitLangfuse,
	}));

	vi.doMock('./braintrust.js', () => ({
		initBraintrust: mockInitBraintrust,
	}));

	const mod = await import('./index.js');
	initAITelemetry = mod.initAITelemetry;
	getAITelemetryConfig = mod.getAITelemetryConfig;
	shutdownAITelemetry = mod.shutdownAITelemetry;
});

afterEach(() => {
	vi.clearAllMocks();

	// Reset shared env object
	for (const key of Object.keys(mockEnv)) {
		delete mockEnv[key];
	}
});

describe('initAITelemetry', () => {
	test('does nothing when AI_TELEMETRY_ENABLED is false', async () => {
		mockEnv['AI_TELEMETRY_ENABLED'] = false;

		await initAITelemetry();

		expect(mockInitLangfuse).not.toHaveBeenCalled();
		expect(mockInitBraintrust).not.toHaveBeenCalled();

		const config = getAITelemetryConfig({ provider: 'open_ai' as any, model: 'gpt-4' });
		expect(config).toBeUndefined();
	});

	test('calls initLangfuse when provider is langfuse', async () => {
		mockEnv['AI_TELEMETRY_ENABLED'] = true;
		mockEnv['AI_TELEMETRY_PROVIDER'] = 'langfuse';

		const mockTracer = { getTracer: vi.fn(), shutdown: vi.fn() };
		mockInitLangfuse.mockResolvedValue({ recordIO: true, tracerProvider: mockTracer });

		await initAITelemetry();

		expect(mockInitLangfuse).toHaveBeenCalled();
		expect(mockInitBraintrust).not.toHaveBeenCalled();
	});

	test('calls initBraintrust when provider is braintrust', async () => {
		mockEnv['AI_TELEMETRY_ENABLED'] = true;
		mockEnv['AI_TELEMETRY_PROVIDER'] = 'braintrust';

		const mockTracer = { getTracer: vi.fn(), shutdown: vi.fn() };
		mockInitBraintrust.mockResolvedValue({ recordIO: false, tracerProvider: mockTracer });

		await initAITelemetry();

		expect(mockInitBraintrust).toHaveBeenCalled();
		expect(mockInitLangfuse).not.toHaveBeenCalled();
	});

	test('warns on unknown provider', async () => {
		mockEnv['AI_TELEMETRY_ENABLED'] = true;
		mockEnv['AI_TELEMETRY_PROVIDER'] = 'unknown-provider';

		await initAITelemetry();

		expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Unknown AI telemetry provider'));
	});

	test('defaults to langfuse when AI_TELEMETRY_PROVIDER is not set', async () => {
		mockEnv['AI_TELEMETRY_ENABLED'] = true;

		const mockTracer = { getTracer: vi.fn(), shutdown: vi.fn() };
		mockInitLangfuse.mockResolvedValue({ recordIO: false, tracerProvider: mockTracer });

		await initAITelemetry();

		expect(mockInitLangfuse).toHaveBeenCalled();
		expect(mockInitBraintrust).not.toHaveBeenCalled();
	});

	test('deduplicates concurrent init calls', async () => {
		mockEnv['AI_TELEMETRY_ENABLED'] = true;
		mockEnv['AI_TELEMETRY_PROVIDER'] = 'langfuse';

		const mockTracer = { getTracer: vi.fn(), shutdown: vi.fn() };
		mockInitLangfuse.mockResolvedValue({ recordIO: false, tracerProvider: mockTracer });

		const [result1, result2] = await Promise.all([initAITelemetry(), initAITelemetry()]);

		expect(result1).toBeUndefined();
		expect(result2).toBeUndefined();
		expect(mockInitLangfuse).toHaveBeenCalledTimes(1);
	});

	test('warns when required config keys are missing', async () => {
		mockEnv['AI_TELEMETRY_ENABLED'] = true;
		mockEnv['AI_TELEMETRY_PROVIDER'] = 'langfuse';

		const mockTracer = { getTracer: vi.fn(), shutdown: vi.fn() };
		mockInitLangfuse.mockResolvedValue({ recordIO: false, tracerProvider: mockTracer });

		await initAITelemetry();

		expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('LANGFUSE_SECRET_KEY, LANGFUSE_PUBLIC_KEY'));
	});

	test('does not warn about missing keys when they are provided', async () => {
		mockEnv['AI_TELEMETRY_ENABLED'] = true;
		mockEnv['AI_TELEMETRY_PROVIDER'] = 'braintrust';
		mockEnv['BRAINTRUST_API_KEY'] = 'bt-key';

		const mockTracer = { getTracer: vi.fn(), shutdown: vi.fn() };
		mockInitBraintrust.mockResolvedValue({ recordIO: false, tracerProvider: mockTracer });

		await initAITelemetry();

		expect(mockLogger.warn).not.toHaveBeenCalled();
	});

	test('logs warning and leaves telemetry disabled when init fails', async () => {
		mockEnv['AI_TELEMETRY_ENABLED'] = true;
		mockEnv['AI_TELEMETRY_PROVIDER'] = 'langfuse';

		mockInitLangfuse.mockRejectedValue(new Error('connection refused'));

		await initAITelemetry();

		expect(mockLogger.warn).toHaveBeenCalledWith(expect.any(Error), 'Failed to initialize AI telemetry');

		const config = getAITelemetryConfig({ provider: 'open_ai' as any, model: 'gpt-4' });
		expect(config).toBeUndefined();
	});
});

describe('getAITelemetryConfig', () => {
	test('returns correct shape after init', async () => {
		mockEnv['AI_TELEMETRY_ENABLED'] = true;
		mockEnv['AI_TELEMETRY_PROVIDER'] = 'langfuse';

		const mockGetTracer = vi.fn().mockReturnValue('tracer-instance');
		const mockTracer = { getTracer: mockGetTracer, shutdown: vi.fn() };
		mockInitLangfuse.mockResolvedValue({ recordIO: true, tracerProvider: mockTracer });

		await initAITelemetry();

		const config = getAITelemetryConfig({ provider: 'open_ai' as any, model: 'gpt-4' });

		expect(config).toEqual({
			isEnabled: true,
			tracer: 'tracer-instance',
			functionId: 'directus-ai-chat',
			recordInputs: true,
			recordOutputs: true,
			metadata: { provider: 'open_ai', model: 'gpt-4' },
		});
	});
});

describe('shutdownAITelemetry', () => {
	test('calls tracerProvider.shutdown()', async () => {
		mockEnv['AI_TELEMETRY_ENABLED'] = true;
		mockEnv['AI_TELEMETRY_PROVIDER'] = 'langfuse';

		const mockShutdown = vi.fn().mockResolvedValue(undefined);
		const mockTracer = { getTracer: vi.fn(), shutdown: mockShutdown };
		mockInitLangfuse.mockResolvedValue({ recordIO: false, tracerProvider: mockTracer });

		await initAITelemetry();
		await shutdownAITelemetry();

		expect(mockShutdown).toHaveBeenCalled();
	});

	test('waits for in-flight init before shutting down', async () => {
		mockEnv['AI_TELEMETRY_ENABLED'] = true;
		mockEnv['AI_TELEMETRY_PROVIDER'] = 'langfuse';
		mockEnv['LANGFUSE_SECRET_KEY'] = 'sk-test';
		mockEnv['LANGFUSE_PUBLIC_KEY'] = 'pk-test';

		const mockShutdown = vi.fn().mockResolvedValue(undefined);
		const mockTracer = { getTracer: vi.fn(), shutdown: mockShutdown };
		let resolveInit: ((value: { recordIO: boolean; tracerProvider: typeof mockTracer }) => void) | undefined;

		const initDeferred = new Promise<{ recordIO: boolean; tracerProvider: typeof mockTracer }>((resolve) => {
			resolveInit = resolve;
		});

		mockInitLangfuse.mockReturnValue(initDeferred);

		const initPromise = initAITelemetry();
		let shutdownSettled = false;

		const shutdownPromise = shutdownAITelemetry().then(() => {
			shutdownSettled = true;
		});

		await vi.waitFor(() => {
			expect(mockInitLangfuse).toHaveBeenCalledTimes(1);
		});

		expect(mockShutdown).not.toHaveBeenCalled();
		expect(shutdownSettled).toBe(false);

		resolveInit?.({ recordIO: false, tracerProvider: mockTracer });

		await shutdownPromise;
		await initPromise;

		expect(mockShutdown).toHaveBeenCalledTimes(1);
		expect(mockLogger.warn).not.toHaveBeenCalled();
	});

	test('logs warning when tracerProvider.shutdown() throws', async () => {
		mockEnv['AI_TELEMETRY_ENABLED'] = true;
		mockEnv['AI_TELEMETRY_PROVIDER'] = 'langfuse';

		const mockShutdown = vi.fn().mockRejectedValue(new Error('shutdown failed'));
		const mockTracer = { getTracer: vi.fn(), shutdown: mockShutdown };
		mockInitLangfuse.mockResolvedValue({ recordIO: false, tracerProvider: mockTracer });

		await initAITelemetry();
		await shutdownAITelemetry();

		expect(mockLogger.warn).toHaveBeenCalledWith(expect.any(Error), 'Failed to shut down AI telemetry');
	});
});
