import { constructUrl } from './construct-url.js';
import { expect, test, vi } from 'vitest';

vi.mock('../../../constants.js', () => ({
	DEFAULT_REGISTRY: 'https://registry.directus.io',
}));

test('Uses default registry when no options provided', () => {
	const url = constructUrl('user123');

	expect(url.hostname).toBe('registry.directus.io');
	expect(url.protocol).toBe('https:');
	expect(url.pathname).toBe('/accounts/user123');
});

test('Uses default registry when empty options provided', () => {
	const url = constructUrl('user456', {});

	expect(url.hostname).toBe('registry.directus.io');
	expect(url.protocol).toBe('https:');
	expect(url.pathname).toBe('/accounts/user456');
});

test('Uses custom registry when provided in options', () => {
	const url = constructUrl('user789', {
		registry: 'https://custom-registry.example.com',
	});

	expect(url.hostname).toBe('custom-registry.example.com');
	expect(url.protocol).toBe('https:');
	expect(url.pathname).toBe('/accounts/user789');
});

test('Uses custom registry with different protocol', () => {
	const url = constructUrl('user101', {
		registry: 'http://localhost:3000',
	});

	expect(url.hostname).toBe('localhost');
	expect(url.port).toBe('3000');
	expect(url.protocol).toBe('http:');
	expect(url.pathname).toBe('/accounts/user101');
});

test('Constructs correct URL path with account ID', () => {
	const url = constructUrl('my-account-id');

	expect(url.pathname).toBe('/accounts/my-account-id');
});

test('Handles special characters in account ID', () => {
	const accountId = 'user@example.com';
	const url = constructUrl(accountId);

	expect(url.pathname).toBe('/accounts/user@example.com');
});

test('Handles numeric account ID', () => {
	const accountId = '12345';
	const url = constructUrl(accountId);

	expect(url.pathname).toBe('/accounts/12345');
});

test('Handles account ID with hyphens and underscores', () => {
	const accountId = 'user-name_123';
	const url = constructUrl(accountId);

	expect(url.pathname).toBe('/accounts/user-name_123');
});

test('Returns URL object with correct type', () => {
	const url = constructUrl('test-user');

	expect(url).toBeInstanceOf(URL);
	expect(typeof url.toString()).toBe('string');
});

test('Registry URL with trailing slash is handled correctly', () => {
	const url = constructUrl('user123', {
		registry: 'https://registry.example.com/',
	});

	expect(url.hostname).toBe('registry.example.com');
	expect(url.pathname).toBe('/accounts/user123');
});

test('Invalid registry URL throws error', () => {
	expect(() => {
		constructUrl('user123', {
			registry: 'invalid-url-without-protocol',
		});
	}).toThrow('Invalid URL');
});

test('Empty account ID creates valid URL', () => {
	const url = constructUrl('');

	expect(url.pathname).toBe('/accounts/');
});

test('Account ID with encoded characters', () => {
	const accountId = 'user%20name';
	const url = constructUrl(accountId);

	expect(url.pathname).toBe('/accounts/user%20name');
});

test('Full URL string generation', () => {
	const url = constructUrl('test-user', {
		registry: 'https://registry.example.com',
	});

	expect(url.toString()).toBe('https://registry.example.com/accounts/test-user');
});
