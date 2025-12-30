import { readConfigurationFromProcess } from './read-configuration-from-process.js';
import { afterEach, beforeEach, expect, test } from 'vitest';

const envBackup = { ...process.env };

beforeEach(() => {
	process.env = {};
});

afterEach(() => {
	process.env = envBackup;
});

test('Returns shallow copy of process.env', () => {
	const env = { TEST: 'foo' };
	process.env = env;

	expect(readConfigurationFromProcess()).toEqual({ TEST: 'foo' });
	expect(readConfigurationFromProcess()).not.toBe(env);
});
