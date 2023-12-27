import { afterEach, expect, test } from 'vitest';
import { getNodeEnv } from './get-node-env.js';

const envBackup = { ...process.env };

afterEach(() => {
	process.env = envBackup;
});

test('Returns configured NODE_ENV', () => {
	process.env['NODE_ENV'] = 'testing';
	expect(getNodeEnv()).toBe('testing');
});
