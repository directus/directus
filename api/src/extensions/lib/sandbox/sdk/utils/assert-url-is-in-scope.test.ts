import { describe, expect, test } from 'vitest';
import { assertUrlIsInScope } from './assert-url-is-in-scope.js';

const scopes = ['https://other.example/**', 'https://allowed.example/**'];

describe('assertUrlIsInScope', () => {
	test.each([
		{ case: 'matches the first scope', url: 'https://other.example/path', scopes },
		{ case: 'matches a later scope', url: 'https://allowed.example/path', scopes },
	])('should allow a url that $case', ({ url, scopes }) => {
		expect(() => assertUrlIsInScope(url, scopes)).not.toThrow();
	});

	test.each([
		{ case: 'matches none of the scopes', url: 'https://blocked.example/path', scopes },
		{ case: 'is checked against no scopes', url: 'https://allowed.example/path', scopes: [] },
	])('should reject a url that $case', ({ url, scopes }) => {
		expect(() => assertUrlIsInScope(url, scopes)).toThrow(`No permission to request "${url}"`);
	});
});
