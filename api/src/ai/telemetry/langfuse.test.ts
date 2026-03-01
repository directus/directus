import { afterEach, describe, expect, test, vi } from 'vitest';
import { applyLangfuseEnv, createLangfuseInputOutputCompatSpanProcessor } from './langfuse.js';

describe('applyLangfuseEnv', () => {
	const originalEnv = { ...process.env };

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.clearAllMocks();
	});

	test('sets LANGFUSE_SECRET_KEY, LANGFUSE_PUBLIC_KEY, LANGFUSE_BASE_URL on process.env', () => {
		const env = {
			LANGFUSE_SECRET_KEY: 'sk-test',
			LANGFUSE_PUBLIC_KEY: 'pk-test',
			LANGFUSE_BASE_URL: 'https://langfuse.example.com',
		} as any;

		applyLangfuseEnv(env);

		expect(process.env['LANGFUSE_SECRET_KEY']).toBe('sk-test');
		expect(process.env['LANGFUSE_PUBLIC_KEY']).toBe('pk-test');
		expect(process.env['LANGFUSE_BASE_URL']).toBe('https://langfuse.example.com');
	});

	test('skips empty strings', () => {
		const env = {
			LANGFUSE_SECRET_KEY: '',
			LANGFUSE_PUBLIC_KEY: '',
			LANGFUSE_BASE_URL: '',
		} as any;

		delete process.env['LANGFUSE_SECRET_KEY'];
		delete process.env['LANGFUSE_PUBLIC_KEY'];
		delete process.env['LANGFUSE_BASE_URL'];

		applyLangfuseEnv(env);

		expect(process.env['LANGFUSE_SECRET_KEY']).toBeUndefined();
		expect(process.env['LANGFUSE_PUBLIC_KEY']).toBeUndefined();
		expect(process.env['LANGFUSE_BASE_URL']).toBeUndefined();
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
