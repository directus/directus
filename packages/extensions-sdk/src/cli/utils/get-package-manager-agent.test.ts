import getPackageManagerAgent from './get-package-manager-agent.js';
import { afterEach, expect, test } from 'vitest';

const envCopy = { ...process.env };

afterEach(() => {
	process.env = envCopy;
});

test('Returns null if user agent cannot be extracted from env', () => {
	delete process.env['npm_config_user_agent'];
	expect(getPackageManagerAgent()).toBe(null);
});

test('Returns information object from parsed user agent', () => {
	process.env['npm_config_user_agent'] = 'pnpm/7.16.0 npm/? node/v18.12.1 darwin arm64';

	expect(getPackageManagerAgent()).toStrictEqual({
		node: 'v18.12.1',
		npm: '?',
		os: 'darwin (arm64)',
		pnpm: '7.16.0',
	});
});
