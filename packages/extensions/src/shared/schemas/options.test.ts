import { describe, expect, it } from 'vitest';
import { ExtensionOptions } from './options.js';

describe('ExtensionOptions', () => {
	it('accepts an API extension without a sandbox', () => {
		const result = ExtensionOptions.safeParse({
			host: '^11.0.0',
			type: 'hook',
			path: 'dist/index.js',
			source: 'src/index.js',
		});

		expect(result.success).toBe(true);
	});

	// Scopes are only meaningful while the sandbox is enabled, so requiring them made valid
	// published extensions unloadable and blocked them from updating in the marketplace
	it('accepts a sandbox without requested scopes', () => {
		const result = ExtensionOptions.safeParse({
			host: '^11.0.0',
			type: 'hook',
			path: 'dist/index.js',
			source: 'src/index.js',
			sandbox: { enabled: false },
		});

		expect(result.success).toBe(true);
	});

	it('accepts an empty sandbox object', () => {
		const result = ExtensionOptions.safeParse({
			host: '^11.0.0',
			type: 'hook',
			path: 'dist/index.js',
			source: 'src/index.js',
			sandbox: {},
		});

		expect(result.success).toBe(true);
	});

	it('accepts requested scopes without the enabled flag', () => {
		const result = ExtensionOptions.safeParse({
			host: '^11.0.0',
			type: 'hook',
			path: 'dist/index.js',
			source: 'src/index.js',
			sandbox: { requestedScopes: { log: {} } },
		});

		expect(result.success).toBe(true);
	});

	it('keeps requested scopes when they are provided', () => {
		const result = ExtensionOptions.safeParse({
			host: '^11.0.0',
			type: 'hook',
			path: 'dist/index.js',
			source: 'src/index.js',
			sandbox: { enabled: true, requestedScopes: { log: {}, sleep: {} } },
		});

		expect(result.success).toBe(true);

		expect(result.data).toEqual(
			expect.objectContaining({
				sandbox: { enabled: true, requestedScopes: { log: {}, sleep: {} } },
			}),
		);
	});

	it('rejects a sandbox with invalid requested scopes', () => {
		const result = ExtensionOptions.safeParse({
			host: '^11.0.0',
			type: 'hook',
			path: 'dist/index.js',
			source: 'src/index.js',
			sandbox: { enabled: true, requestedScopes: { request: { urls: ['https://directus.io'] } } },
		});

		expect(result.success).toBe(false);
	});
});
