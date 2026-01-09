import { expect, test } from 'vitest';
import { sameOrigin } from './same-origin';

test('Returns true for same origin URLs', () => {
	expect(sameOrigin('https://example.com/path1', 'https://example.com/path2')).toBe(true);
});

test('Returns false for different origins', () => {
	expect(sameOrigin('https://example.com', 'https://other.com')).toBe(false);
});

test('Returns false for invalid URL in first param', () => {
	expect(sameOrigin('not a url', 'https://example.com')).toBe(false);
});

test('Returns false for invalid URL in second param', () => {
	expect(sameOrigin('https://example.com', 'not a url')).toBe(false);
});

test('Handles URLs with different paths but same origin', () => {
	expect(sameOrigin('https://example.com/a/b/c', 'https://example.com/x/y/z')).toBe(true);
});

test('Handles URLs with different ports (different origins)', () => {
	expect(sameOrigin('https://example.com:443', 'https://example.com:8080')).toBe(false);
});

test('Handles http vs https (different origins)', () => {
	expect(sameOrigin('http://example.com', 'https://example.com')).toBe(false);
});

test('Handles URLs with query params and fragments', () => {
	expect(sameOrigin('https://example.com?a=1', 'https://example.com#section')).toBe(true);
});

test('Returns true for same subdomain', () => {
	expect(sameOrigin('https://app.example.com', 'https://app.example.com/path')).toBe(true);
});

test('Returns false for different subdomains', () => {
	expect(sameOrigin('https://app.example.com', 'https://api.example.com')).toBe(false);
});
