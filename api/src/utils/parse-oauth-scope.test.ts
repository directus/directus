import { describe, expect, test } from 'vitest';
import { parseOAuthScope } from './parse-oauth-scope.js';

describe('parseOAuthScope', () => {
	test('parses single scope', () => {
		expect(parseOAuthScope('mcp:access')).toEqual(['mcp:access']);
	});

	test('parses multiple space-separated scopes', () => {
		expect(parseOAuthScope('mcp:access read write')).toEqual(['mcp:access', 'read', 'write']);
	});

	test('handles multiple spaces between tokens', () => {
		expect(parseOAuthScope('mcp:access   read')).toEqual(['mcp:access', 'read']);
	});

	test('trims leading and trailing whitespace', () => {
		expect(parseOAuthScope('  mcp:access  ')).toEqual(['mcp:access']);
	});

	test('deduplicates scope tokens', () => {
		expect(parseOAuthScope('mcp:access mcp:access read')).toEqual(['mcp:access', 'read']);
	});

	test('returns empty array for empty string', () => {
		expect(parseOAuthScope('')).toEqual([]);
	});

	test('returns empty array for whitespace-only string', () => {
		expect(parseOAuthScope('   ')).toEqual([]);
	});

	test('returns empty array for undefined', () => {
		expect(parseOAuthScope(undefined)).toEqual([]);
	});

	test('returns empty array for null', () => {
		expect(parseOAuthScope(null)).toEqual([]);
	});

	test('returns empty array for non-string', () => {
		expect(parseOAuthScope(42)).toEqual([]);
	});
});
