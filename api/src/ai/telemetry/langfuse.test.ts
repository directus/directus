import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { applyLangfuseEnv } from './langfuse.js';

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
