import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { isDirectusVariable } from '../utils/is-directus-variable.js';
import { readConfigurationFromProcess } from '../utils/read-configuration-from-process.js';
import { createEnv } from './create-env.js';
import { readConfigurationFromFile } from './read-configuration-from-file.js';

vi.mock('../utils/get-config-path.js');
vi.mock('../utils/read-configuration-from-process.js');
vi.mock('./read-configuration-from-file.js');
vi.mock('../utils/is-directus-variable.js');
vi.mock('node:fs');

vi.mock('../constants/defaults.js', () => ({
	DEFAULTS: {
		DEFAULT: 'test-default',
		DEFAULT_ARRAY: 'one,two,three',
	},
}));

afterEach(() => {
	vi.resetAllMocks();
});

test('Defaults that have a type set is casted', () => {
	const processConfigs = {
		PROCESS1: 'test-process',
		PROCESS2: 'array:one,two',
		PROCESS3: 'one,two,three',
		PROCESS4: 'array:string:hey,number:1',
		PROCESS5_FILE: './file.txt',
		PROCESS6_FILE: 'array:./file.txt',
		PROCESS7: 'string:ran,d0m',
		PROCESS8_FILE: 'string:./file.txt',
	};

	const fileConfigs = {
		FILE1: 'test-file',
		FILE2_FILE: './file.txt',
		FILE3_FILE: 'array:./file.txt',
	};

	vi.mocked(readConfigurationFromProcess).mockReturnValue(processConfigs);
	vi.mocked(readConfigurationFromFile).mockReturnValue(fileConfigs);
	vi.mocked(isDirectusVariable).mockReturnValue(true);
	vi.mocked(readFileSync).mockReturnValueOnce('file-content');
	vi.mocked(readFileSync).mockReturnValueOnce('one,two,three');
	vi.mocked(readFileSync).mockReturnValueOnce('ran,d0m,from-file');
	vi.mocked(readFileSync).mockReturnValueOnce('file-from-file-content');
	vi.mocked(readFileSync).mockReturnValueOnce('elem1,elem2');

	const env = createEnv();

	expect(env).toEqual({
		PROCESS1: 'test-process',
		PROCESS2: ['one', 'two'],
		PROCESS3: ['one', 'two', 'three'],
		PROCESS4: ['hey', 1],
		PROCESS5: 'file-content',
		PROCESS6: ['one', 'two', 'three'],
		PROCESS7: 'ran,d0m',
		PROCESS8: 'ran,d0m,from-file',
		FILE1: 'test-file',
		FILE2: 'file-from-file-content',
		FILE3: ['elem1', 'elem2'],
		DEFAULT: 'test-default',
		DEFAULT_ARRAY: 'one,two,three',
	});
});

describe('File-backed Flow environment variables', () => {
	test.each(['MY_SECRET', 'OTHER,MY_SECRET', ['OTHER', 'MY_SECRET']].map((allowList) => ({ allowList })))(
		'Resolves custom secrets with allow-list $allowList',
		({ allowList }) => {
			vi.mocked(readConfigurationFromProcess).mockReturnValue({
				MY_SECRET_FILE: './secret.txt',
				FLOWS_ENV_ALLOW_LIST: allowList,
			});

			vi.mocked(readFileSync).mockReturnValue('secret-value');

			const env = createEnv();

			expect(env['MY_SECRET']).toBe('secret-value');
			expect(env).not.toHaveProperty('MY_SECRET_FILE');
			expect(readFileSync).toHaveBeenCalledExactlyOnceWith('./secret.txt', { encoding: 'utf8' });
		},
	);

	test('Resolves a file-backed allow-list before custom secrets regardless of configuration order', () => {
		vi.mocked(readConfigurationFromProcess).mockReturnValue({ MY_SECRET_FILE: './secret.txt' });
		vi.mocked(readConfigurationFromFile).mockReturnValue({ FLOWS_ENV_ALLOW_LIST_FILE: './allow-list.txt' });
		vi.mocked(isDirectusVariable).mockImplementation((key) => key === 'FLOWS_ENV_ALLOW_LIST_FILE');
		vi.mocked(readFileSync).mockImplementation((path) => (path === './allow-list.txt' ? 'MY_SECRET' : 'secret-value'));

		const env = createEnv();

		expect(env['MY_SECRET']).toBe('secret-value');
		expect(env['FLOWS_ENV_ALLOW_LIST']).toBe('MY_SECRET');
		expect(readFileSync).toHaveBeenCalledTimes(2);
	});

	test.each([undefined, false, 'OTHER', 'MY_SECRET_FILE'])('Leaves unselected file paths intact (%j)', (allowList) => {
		vi.mocked(readConfigurationFromProcess).mockReturnValue({
			MY_SECRET_FILE: './secret.txt',
			FLOWS_ENV_ALLOW_LIST: allowList,
		});

		const env = createEnv();

		expect(env['MY_SECRET_FILE']).toBe('./secret.txt');
		expect(env).not.toHaveProperty('MY_SECRET');
		expect(readFileSync).not.toHaveBeenCalled();
	});

	test('Preserves explicit casting for custom secrets from a configuration file', () => {
		vi.mocked(readConfigurationFromFile).mockReturnValue({
			MY_SECRET_FILE: 'string:./secret.txt',
			FLOWS_ENV_ALLOW_LIST: 'MY_SECRET',
		});

		vi.mocked(readFileSync).mockReturnValue('00123,true');

		expect(createEnv()['MY_SECRET']).toBe('00123,true');
		expect(readFileSync).toHaveBeenCalledExactlyOnceWith('./secret.txt', { encoding: 'utf8' });
	});

	test.each([true, false])('Prefers selected secret files over direct values (file first: %j)', (fileFirst) => {
		const values = { MY_SECRET: 'direct-value', MY_SECRET_FILE: './secret.txt' };

		vi.mocked(readConfigurationFromProcess).mockReturnValue({
			...(fileFirst ? Object.fromEntries(Object.entries(values).reverse()) : values),
			FLOWS_ENV_ALLOW_LIST: 'MY_SECRET',
		});

		vi.mocked(readFileSync).mockReturnValue('file-value');

		expect(createEnv()['MY_SECRET']).toBe('file-value');
	});

	test('Preserves empty secret file contents', () => {
		vi.mocked(readConfigurationFromProcess).mockReturnValue({
			MY_SECRET_FILE: './secret.txt',
			FLOWS_ENV_ALLOW_LIST: 'MY_SECRET',
		});

		vi.mocked(readFileSync).mockReturnValue('');

		expect(createEnv()['MY_SECRET']).toBe('');
	});

	test('Does not read non-string custom file settings', () => {
		vi.mocked(readConfigurationFromFile).mockReturnValue({
			MY_SECRET_FILE: null,
			FLOWS_ENV_ALLOW_LIST: 'MY_SECRET',
		});

		expect(createEnv()).not.toHaveProperty('MY_SECRET');
		expect(readFileSync).not.toHaveBeenCalled();
	});

	test('Fails when an explicitly selected secret file cannot be read', () => {
		vi.mocked(readConfigurationFromProcess).mockReturnValue({
			MY_SECRET_FILE: './missing.txt',
			FLOWS_ENV_ALLOW_LIST: 'MY_SECRET',
		});

		vi.mocked(readFileSync).mockImplementation(() => {
			throw new Error('ENOENT');
		});

		expect(() => createEnv()).toThrow(
			'Failed to read value from file "./missing.txt", defined in environment variable "MY_SECRET_FILE".',
		);
	});
});
