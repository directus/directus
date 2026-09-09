import { expect, test } from 'vitest';
import { assertUrlIsInScope } from './assert-url-is-in-scope.js';

test('allows a URL that matches one of the configured scopes', () => {
	expect(() =>
		assertUrlIsInScope('https://allowed.example/path', ['https://other.example/**', 'https://allowed.example/**']),
	).not.toThrow();
});

test('rejects a URL that does not match a configured scope', () => {
	expect(() => assertUrlIsInScope('https://blocked.example/path', ['https://allowed.example/**'])).toThrow(
		'No permission to request "https://blocked.example/path"',
	);
});
