import { readConfigurationFromDotEnv } from './read-configuration-from-dotenv.js';
import { parse } from 'dotenv';
import { readFileSync } from 'node:fs';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('dotenv');
vi.mock('node:fs');

afterEach(() => {
	vi.clearAllMocks();
});

test('Reads file contents of path synchronously', () => {
	readConfigurationFromDotEnv('./test/path');
	expect(readFileSync).toHaveBeenCalledWith('./test/path');
});

test('Parses file contents with dotenv', () => {
	vi.mocked(readFileSync).mockReturnValue('dotenv-file-contents');
	readConfigurationFromDotEnv('./test/path');
	expect(parse).toHaveBeenCalledWith('dotenv-file-contents');
});

test('Returns parsed dotenv config', () => {
	vi.mocked(parse).mockReturnValue({ hello: 'world' });
	expect(readConfigurationFromDotEnv('./test/path')).toEqual({ hello: 'world' });
});
