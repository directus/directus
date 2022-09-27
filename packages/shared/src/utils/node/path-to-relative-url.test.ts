import path from 'path';
import { describe, expect, it } from 'vitest';
import { pathToRelativeUrl } from './path-to-relative-url';

describe('pathToRelativeUrl', () => {
	const filePath = path.resolve(path.join('foo', 'bar.txt'));

	it('returns a URL relative to the current working directory', async () => {
		const relativeUrl = pathToRelativeUrl(filePath);

		expect(relativeUrl).toBe('foo/bar.txt');
	});

	it('returns a URL relative to the given path if it is passed as the second argument', async () => {
		const relativeUrl = pathToRelativeUrl(filePath, __dirname);

		expect(relativeUrl).toBe('../../../foo/bar.txt');
	});
});
