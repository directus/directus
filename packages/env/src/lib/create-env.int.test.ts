import { afterEach, expect, test, vi } from 'vitest';
import { readConfigurationFromProcess } from '../utils/read-configuration-from-process.js';
import { createEnv } from './create-env.js';
import { readConfigurationFromFile } from './read-configuration-from-file.js';
import { isDirectusVariable } from '../utils/is-directus-variable.js';
import { readFileSync } from 'node:fs';

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
		PROCESS2: 'array:1,2',
		PROCESS3: 'array:string:hey,number:1',
		PROCESS4_FILE: './file.txt',
		PROCESS5_FILE: 'array:./file.txt',
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
	vi.mocked(readFileSync).mockReturnValueOnce('file-from-file-content');
	vi.mocked(readFileSync).mockReturnValueOnce('elem1,elem2');

	const env = createEnv();

	expect(env).toEqual({
		PROCESS1: 'test-process',
		PROCESS2: [1, 2],
		PROCESS3: ['hey', 1],
		PROCESS4: 'file-content',
		PROCESS5: ['one', 'two', 'three'],
		FILE1: 'test-file',
		FILE2: 'file-from-file-content',
		FILE3: ['elem1', 'elem2'],
		DEFAULT: 'test-default',
		DEFAULT_ARRAY: 'one,two,three',
	});
});
