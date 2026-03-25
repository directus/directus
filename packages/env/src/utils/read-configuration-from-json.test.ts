import { createRequire } from 'node:module';
import { isPlainObject } from 'lodash-es';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { readConfigurationFromJson } from './read-configuration-from-json.js';

vi.mock('lodash-es');

vi.mock('node:module', async (importOriginal) => {
	const mod = await importOriginal<typeof import('node:module')>();

	return {
		...mod,
		createRequire: vi.fn(),
	};
});

let mockRequire: NodeRequire;

beforeEach(() => {
	mockRequire = vi.fn() as unknown as NodeRequire;

	vi.mocked(createRequire).mockReturnValue(mockRequire);
});

afterEach(() => {
	vi.clearAllMocks();
});

test('Reads file with require', () => {
	readConfigurationFromJson('./test/path.json');

	expect(mockRequire).toHaveBeenCalledWith('./test/path.json');
});

test('Returns config from JSON file if file contains plain object', () => {
	const mockFileContents = { foo: 'bar' };

	vi.mocked(isPlainObject).mockReturnValue(true);

	vi.mocked(mockRequire).mockReturnValue(mockFileContents);

	const config = readConfigurationFromJson('./test/path.json');

	expect(config).toBe(mockFileContents);
});

test('Throws error if JSON file does not contain single plain object', () => {
	vi.mocked(isPlainObject).mockReturnValue(false);

	expect(() => readConfigurationFromJson('./test/path.json')).toThrowErrorMatchingInlineSnapshot(
		`[Error: JSON configuration file does not contain an object]`,
	);
});
