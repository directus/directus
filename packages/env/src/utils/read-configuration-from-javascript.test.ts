import { readConfigurationFromJavaScript } from './read-configuration-from-javascript.js';
import { isPlainObject } from 'lodash-es';
import { createRequire } from 'node:module';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

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
	vi.mocked(mockRequire).mockReturnValue(() => ({}));
	vi.mocked(createRequire).mockReturnValue(mockRequire);
});

afterEach(() => {
	vi.clearAllMocks();
});

test('Reads file with node require', () => {
	readConfigurationFromJavaScript('./test/path.js');
	expect(mockRequire).toHaveBeenCalledWith('./test/path.js');
});

test('Executes function if default export is a function type', () => {
	const fn = vi.fn().mockReturnValue({ test: 'foo' });
	vi.mocked(mockRequire).mockReturnValue(fn);

	const config = readConfigurationFromJavaScript('./test/path.js');

	expect(fn).toHaveBeenCalledWith(process.env);
	expect(config).toEqual({ test: 'foo' });
});

test('Returns exported thing if it is a plain object', () => {
	const config = { test: 'foo' };
	vi.mocked(mockRequire).mockReturnValue(config);
	vi.mocked(isPlainObject).mockReturnValue(true);

	expect(readConfigurationFromJavaScript('./test/path.js')).toBe(config);
});

test('Returns default key from exported module', () => {
	const config = { test: 'foo' };
	const mod = { default: config };
	vi.mocked(mockRequire).mockReturnValue(mod);
	vi.mocked(isPlainObject).mockReturnValue(true);

	expect(readConfigurationFromJavaScript('./test/path.js')).toBe(config);
});

test('Throws an error if the exported value is not a function or plain object', () => {
	vi.mocked(mockRequire).mockReturnValue(123);

	expect(() => readConfigurationFromJavaScript('./test/path.js')).toThrowErrorMatchingInlineSnapshot(
		`[Error: Invalid JS configuration file export type. Requires one of "function", "object", received: "undefined"]`,
	);
});
