import { afterEach, describe, expect, test, vi } from 'vitest';
import { applyBraintrustEnv } from './braintrust.js';

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
