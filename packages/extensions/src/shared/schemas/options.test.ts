import { describe, expect, it } from 'vitest';
import { ExtensionOptions } from './options.js';

const API_EXTENSION = {
	host: '^11.0.0',
	type: 'hook',
	path: 'dist/index.js',
	source: 'src/index.js',
};

// Requiring `enabled` made valid published extensions unloadable
const VALID_SANDBOX_CASES = [
	{ description: 'a disabled sandbox without requested scopes', sandbox: { enabled: false } },
	{ description: 'an empty sandbox object', sandbox: {} },
	{ description: 'requested scopes without the enabled flag', sandbox: { requestedScopes: { log: {} } } },
	{
		description: 'an enabled sandbox with requested scopes',
		sandbox: { enabled: true, requestedScopes: { log: {}, sleep: {} } },
	},
];

describe('ExtensionOptions', () => {
	it('accepts an API extension without a sandbox', () => {
		const result = ExtensionOptions.safeParse(API_EXTENSION);

		expect(result.success).toBe(true);
	});

	it.each(VALID_SANDBOX_CASES)('accepts $description', ({ sandbox }) => {
		const result = ExtensionOptions.safeParse({ ...API_EXTENSION, sandbox });

		expect(result.success).toBe(true);

		expect(result.data).toEqual(expect.objectContaining({ sandbox }));
	});

	it('rejects a sandbox with invalid requested scopes', () => {
		const result = ExtensionOptions.safeParse({
			...API_EXTENSION,
			sandbox: { enabled: true, requestedScopes: { request: { urls: ['https://directus.io'] } } },
		});

		expect(result.success).toBe(false);
	});
});
