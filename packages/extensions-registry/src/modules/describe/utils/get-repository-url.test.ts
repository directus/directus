import { expect, test } from 'vitest';
import { getRepositoryUrl } from './get-repository-url.js';

test('Returns null for non-git repos', () => {
	expect(getRepositoryUrl({ type: 'nope', url: 'questionable' })).toBe(null);
});

test('Returns URL for Git repos', () => {
	expect(getRepositoryUrl({ type: 'git', url: 'git+https://example.com/repo.git' })).toBe(
		'https://example.com/repo.git',
	);
});
