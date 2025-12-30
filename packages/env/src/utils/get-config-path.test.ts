import { getConfigPath } from './get-config-path.js';
import { DEFAULTS } from '../constants/defaults.js';
import { resolve } from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

vi.mock('node:path');

const envBackup = { ...process.env };

beforeEach(() => {
	process.env = {};
	vi.mocked(resolve).mockReturnValue('test-resolved-path');
});

afterEach(() => {
	vi.clearAllMocks();
	process.env = envBackup;
});

test('Resolves configured CONFIG_PATH from env', () => {
	process.env['CONFIG_PATH'] = 'test-config-path';
	const res = getConfigPath();
	expect(resolve).toHaveBeenCalledWith('test-config-path');
	expect(res).toBe('test-resolved-path');
});

test('Resolves configured CONFIG_PATH from defaults if it does not exist in env', () => {
	process.env['CONFIG_PATH'] = undefined;
	const res = getConfigPath();
	expect(resolve).toHaveBeenCalledWith(DEFAULTS.CONFIG_PATH);
	expect(res).toBe('test-resolved-path');
});
