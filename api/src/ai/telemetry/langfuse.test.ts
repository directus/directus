import { afterEach, beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import { createLangfuseInputOutputCompatSpanProcessor } from './langfuse.js';

const mockNodeTracerProvider = vi.fn();
const mockLangfuseSpanProcessor = vi.fn();

vi.mock('@opentelemetry/sdk-trace-node', () => ({
	NodeTracerProvider: mockNodeTracerProvider,
}));

vi.mock('@langfuse/otel', () => ({
	LangfuseSpanProcessor: mockLangfuseSpanProcessor,
}));

describe('initLangfuse', () => {
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
		const { initLangfuse } = await import('./langfuse.js');

		const env = {
			LANGFUSE_SECRET_KEY: 'sk-test',
			LANGFUSE_PUBLIC_KEY: 'pk-test',
			LANGFUSE_BASE_URL: '',
			AI_TELEMETRY_RECORD_IO: true,
		} as any;

		const state = await initLangfuse(env);

		expect(state.recordIO).toBe(true);
		expect(state.tracerProvider).toBeDefined();
		expect(state.tracerProvider.getTracer).toBeDefined();
		expect(state.tracerProvider.shutdown).toBeDefined();
	});

	test('recordIO is false when AI_TELEMETRY_RECORD_IO is not true', async () => {
		const { initLangfuse } = await import('./langfuse.js');

		const env = {
			LANGFUSE_SECRET_KEY: 'sk-test',
			LANGFUSE_PUBLIC_KEY: 'pk-test',
			LANGFUSE_BASE_URL: '',
			AI_TELEMETRY_RECORD_IO: false,
		} as any;

		const state = await initLangfuse(env);

		expect(state.recordIO).toBe(false);
	});
});

describe('createLangfuseInputOutputCompatSpanProcessor', () => {
	const processor = createLangfuseInputOutputCompatSpanProcessor();

	const makeSpan = (name: string, attributes: Record<string, unknown> = {}) => ({
		name,
		attributes,
	});

	test('ignores spans that do not start with "ai."', () => {
		const span = makeSpan('http.request', { 'ai.prompt': 'hello' });
		processor.onEnd(span);

		expect(span.attributes['langfuse.observation.input']).toBeUndefined();
	});

	test('copies ai.prompt.messages to langfuse attributes', () => {
		const span = makeSpan('ai.generateText', {
			'ai.prompt.messages': '{"role":"user","content":"hi"}',
		});

		processor.onEnd(span);

		expect(span.attributes['langfuse.observation.input']).toBe('{"role":"user","content":"hi"}');
		expect(span.attributes['langfuse.trace.input']).toBe('{"role":"user","content":"hi"}');
	});

	test('copies ai.response.text to langfuse attributes', () => {
		const span = makeSpan('ai.generateText', {
			'ai.response.text': 'hello back',
		});

		processor.onEnd(span);

		expect(span.attributes['langfuse.observation.output']).toBe('hello back');
		expect(span.attributes['langfuse.trace.output']).toBe('hello back');
	});

	test('does not overwrite existing langfuse attributes', () => {
		const span = makeSpan('ai.generateText', {
			'langfuse.observation.input': 'existing-input',
			'langfuse.trace.input': 'existing-trace-input',
			'langfuse.observation.output': 'existing-output',
			'langfuse.trace.output': 'existing-trace-output',
			'ai.prompt.messages': 'fallback',
			'ai.response.text': 'fallback-output',
		});

		processor.onEnd(span);

		expect(span.attributes['langfuse.observation.input']).toBe('existing-input');
		expect(span.attributes['langfuse.trace.input']).toBe('existing-trace-input');
		expect(span.attributes['langfuse.observation.output']).toBe('existing-output');
		expect(span.attributes['langfuse.trace.output']).toBe('existing-trace-output');
	});

	test('prefers ai.prompt.messages over ai.prompt for input fallback', () => {
		const span = makeSpan('ai.generateText', {
			'ai.prompt.messages': 'messages-value',
			'ai.prompt': 'prompt-value',
		});

		processor.onEnd(span);

		expect(span.attributes['langfuse.observation.input']).toBe('messages-value');
	});

	test('falls back to ai.prompt when ai.prompt.messages is missing', () => {
		const span = makeSpan('ai.generateText', {
			'ai.prompt': 'prompt-value',
		});

		processor.onEnd(span);

		expect(span.attributes['langfuse.observation.input']).toBe('prompt-value');
	});

	test('falls back to ai.response.object when ai.response.text is missing', () => {
		const span = makeSpan('ai.generateText', {
			'ai.response.object': '{"result":true}',
		});

		processor.onEnd(span);

		expect(span.attributes['langfuse.observation.output']).toBe('{"result":true}');
	});
});
