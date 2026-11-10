import { readFileSync } from 'node:fs';
import { afterEach, expect, test, vi } from 'vitest';
import { readConfigurationFromEnv } from './read-configuration-from-env.js';

vi.mock('node:fs');

afterEach(() => {
	vi.clearAllMocks();
});

test('Reads file contents of path synchronously', () => {
	vi.mocked(readFileSync).mockReturnValue('');
	readConfigurationFromEnv('./test/path');
	expect(readFileSync).toHaveBeenCalledWith('./test/path');
});

test('Returns parsed dotenv config', () => {
	vi.mocked(readFileSync).mockReturnValue('HELLO=world\n# comment\nexport QUOTED="a # b"\nMULTI="one\ntwo"');

	expect(readConfigurationFromEnv('./test/path')).toEqual({
		HELLO: 'world',
		QUOTED: 'a # b',
		MULTI: 'one\ntwo',
	});
});

test.each([
	['KEY=', {}],
	['KEY= ', {}],
	['KEY= # comment', {}],
	['export KEY=', {}],
	['KEY=""', { KEY: '' }],
	["KEY=''", { KEY: '' }],
	['KEY=value\nKEY=', {}],
	['KEY=\nKEY=""', { KEY: '' }],
	['KEY=value', { KEY: 'value' }],
])('Leaves out variables without a value in %j', (contents, expected) => {
	vi.mocked(readFileSync).mockReturnValue(contents);

	expect(readConfigurationFromEnv('./test/path')).toEqual(expected);
});
