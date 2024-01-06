import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getConfigPath } from '../utils/get-config-path.js';
import { isDirectusVariable } from '../utils/is-directus-variable.js';
import { isFileKey } from '../utils/is-file-key.js';
import { readConfigurationFromProcess } from '../utils/read-configuration-from-process.js';
import { removeFileSuffix } from '../utils/remove-file-suffix.js';
import { cast } from './cast.js';
import { createEnv } from './create-env.js';
import { readConfigurationFromFile } from './read-configuration-from-file.js';

vi.mock('../utils/get-config-path.js');
vi.mock('../utils/is-directus-variable.js');
vi.mock('../utils/is-file-key.js');
vi.mock('../utils/read-configuration-from-process.js');
vi.mock('../utils/remove-file-suffix.js');
vi.mock('./cast.js');
vi.mock('./read-configuration-from-file.js');
vi.mock('node:fs');

vi.mock('../constants/defaults.js', () => ({
	DEFAULTS: {
		DEFAULT: 'test-default',
	},
}));

let processConfig: Record<string, string>;
let fileConfig: Record<string, unknown>;

beforeEach(() => {
	vi.mocked(cast).mockImplementation((_key, value) => value);

	processConfig = { PROCESS: 'test-process' };
	fileConfig = { FILE: 'test-file' };

	vi.mocked(readConfigurationFromProcess).mockReturnValue(processConfig);
	vi.mocked(readConfigurationFromFile).mockReturnValue(fileConfig);
});

afterEach(() => {
	vi.resetAllMocks();
});

test('Combines process/file based config with defaults', () => {
	const env = createEnv();

	expect(env).toEqual({
		PROCESS: 'test-process',
		FILE: 'test-file',
		DEFAULT: 'test-default',
	});
});

test('Reads file configuration from config path', () => {
	vi.mocked(getConfigPath).mockReturnValue('./test/config/path');

	createEnv();

	expect(readConfigurationFromFile).toHaveBeenCalledWith('./test/config/path');
});

test('Skips environment variables that are not Directus configuration flags', () => {
	vi.mocked(isDirectusVariable).mockImplementation((key) => {
		return key === 'PROCESS';
	});

	const env = createEnv();

	expect(env).toEqual({
		PROCESS: 'test-process',
		DEFAULT: 'test-default',
	});
});

test('Reads value from file if key is a file key', () => {
	vi.mocked(readConfigurationFromFile).mockReturnValue({
		TEST_FILE: './test/path',
	});

	vi.mocked(isFileKey).mockImplementation((key) => {
		return key === 'TEST_FILE';
	});

	vi.mocked(removeFileSuffix).mockReturnValue('TEST');
	vi.mocked(readFileSync).mockReturnValue('file-contents');

	const env = createEnv();

	expect(removeFileSuffix).toHaveBeenCalledWith('TEST_FILE');
	expect(readFileSync).toHaveBeenCalledWith('./test/path', { encoding: 'utf8' });

	expect(env).toEqual({
		PROCESS: 'test-process',
		TEST: 'file-contents',
		DEFAULT: 'test-default',
	});
});

test('Throws error if file could not be read', () => {
	vi.mocked(readConfigurationFromFile).mockReturnValue({
		TEST_FILE: './test/path',
	});

	vi.mocked(isFileKey).mockImplementation((key) => {
		return key === 'TEST_FILE';
	});

	vi.mocked(removeFileSuffix).mockReturnValue('TEST');

	vi.mocked(readFileSync).mockImplementation(() => {
		throw new Error('nah');
	});

	expect(() => createEnv()).toThrowErrorMatchingInlineSnapshot(
		`[Error: Failed to read value from file "./test/path", defined in environment variable "TEST_FILE".]`,
	);
});

test('Casts regular values', () => {
	vi.mocked(cast).mockImplementation((_key, value) => `cast-${value}`);

	const env = createEnv();

	expect(env).toEqual({
		PROCESS: 'cast-test-process',
		FILE: 'cast-test-file',
		DEFAULT: 'test-default',
	});
});
