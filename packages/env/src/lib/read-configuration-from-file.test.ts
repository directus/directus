import { existsSync } from 'node:fs';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getFileExtension } from '../utils/get-file-extension.js';
import { readConfigurationFromDotEnv } from '../utils/read-configuration-from-dotenv.js';
import { readConfigurationFromJavaScript } from '../utils/read-configuration-from-javascript.js';
import { readConfigurationFromJson } from '../utils/read-configuration-from-json.js';
import { readConfigurationFromYaml } from '../utils/read-configuration-from-yaml.js';
import { readConfigurationFromFile } from './read-configuration-from-file.js';

vi.mock('node:fs');
vi.mock('../utils/get-file-extension.js');
vi.mock('../utils/read-configuration-from-dotenv.js');
vi.mock('../utils/read-configuration-from-javascript.js');
vi.mock('../utils/read-configuration-from-json.js');
vi.mock('../utils/read-configuration-from-yaml.js');

beforeEach(() => {
	vi.mocked(readConfigurationFromJavaScript).mockReturnValue({ JS: true });
	vi.mocked(readConfigurationFromJson).mockReturnValue({ JSON: true });
	vi.mocked(readConfigurationFromYaml).mockReturnValue({ YAML: true });
	vi.mocked(readConfigurationFromDotEnv).mockReturnValue({ DOTENV: 'true' });
});

afterEach(() => {
	vi.resetAllMocks();
});

test('Returns null if file path does not exist', () => {
	vi.mocked(existsSync).mockReturnValue(false);

	expect(readConfigurationFromFile('./test/path')).toBe(null);
});

test('Reads JS file if extension is js', () => {
	vi.mocked(getFileExtension).mockReturnValue('js');

	expect(readConfigurationFromFile('./test/path')).toEqual({ JS: true });
});

test('Reads JSON file if extension is json', () => {
	vi.mocked(getFileExtension).mockReturnValue('json');

	expect(readConfigurationFromFile('./test/path')).toEqual({ JSON: true });
});

test('Reads yaml file if extension is yaml or yml', () => {
	vi.mocked(getFileExtension).mockReturnValue('yaml');
	expect(readConfigurationFromFile('./test/path')).toEqual({ YAML: true });

	vi.mocked(getFileExtension).mockReturnValue('yml');
	expect(readConfigurationFromFile('./test/path')).toEqual({ YAML: true });
});

test('Reads from dotenv file if extension is unknown or missing', () => {
	vi.mocked(getFileExtension).mockReturnValue('');
	expect(readConfigurationFromFile('./test/path')).toEqual({ DOTENV: 'true' });
});
