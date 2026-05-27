import { describe, expect, it } from 'vitest';
import { removeQueryFromPath } from './remove-query-from-path';

describe('removeQueryFromPath', () => {
	it('removes a single key', () => {
		expect(removeQueryFromPath('/content/posts/+?version=draft&versionId=abc', 'versionId')).toBe(
			'/content/posts/+?version=draft',
		);
	});

	it('removes multiple keys', () => {
		expect(removeQueryFromPath('/content/posts/+?version=draft&versionId=abc', 'version', 'versionId')).toBe(
			'/content/posts/+',
		);
	});

	it('returns base path without trailing ? when all keys removed', () => {
		expect(removeQueryFromPath('/content/posts/3?version=draft', 'version')).toBe('/content/posts/3');
	});

	it('preserves keys not in the removal list', () => {
		expect(removeQueryFromPath('/content/posts/3?version=draft&bookmark=xyz', 'version')).toBe(
			'/content/posts/3?bookmark=xyz',
		);
	});

	it('is a no-op when key is absent', () => {
		expect(removeQueryFromPath('/content/posts/3?version=draft', 'versionId')).toBe('/content/posts/3?version=draft');
	});

	it('handles path with no query string', () => {
		expect(removeQueryFromPath('/content/posts/3', 'version')).toBe('/content/posts/3');
	});
});
