import { describe, expect, test } from 'vitest';
import { DEFAULT_REGISTRY } from '../../../constants.js';
import { constructUrl } from './construct-url.js';

describe('constructUrl', () => {
	test('Constructs URL with version ID and default registry', () => {
		const versionId = 'test-extension-v1.0.0';
		const result = constructUrl(versionId);

		expect(result).toBeInstanceOf(URL);
		expect(result.href).toBe(`${DEFAULT_REGISTRY}/download/${versionId}`);
		expect(result.pathname).toBe(`/download/${versionId}`);
		expect(result.origin).toBe(DEFAULT_REGISTRY);
		expect(result.searchParams.size).toBe(0);
	});

	test('Constructs URL with sandbox mode disabled by default', () => {
		const versionId = 'test-extension-v1.0.0';
		const result = constructUrl(versionId);

		expect(result.searchParams.has('sandbox')).toBe(false);
		expect(result.searchParams.size).toBe(0);
	});

	test('Constructs URL with sandbox mode enabled when requireSandbox is true', () => {
		const versionId = 'test-extension-v1.0.0';
		const result = constructUrl(versionId, true);

		expect(result.searchParams.get('sandbox')).toBe('true');
		expect(result.searchParams.size).toBe(1);
		expect(result.href).toBe(`${DEFAULT_REGISTRY}/download/${versionId}?sandbox=true`);
	});

	test('Constructs URL with sandbox mode disabled when requireSandbox is false', () => {
		const versionId = 'test-extension-v1.0.0';
		const result = constructUrl(versionId, false);

		expect(result.searchParams.has('sandbox')).toBe(false);
		expect(result.searchParams.size).toBe(0);
	});

	test('Uses custom registry when provided in options', () => {
		const versionId = 'test-extension-v1.0.0';
		const customRegistry = 'https://custom-registry.example.com';
		const result = constructUrl(versionId, false, { registry: customRegistry });

		expect(result.href).toBe(`${customRegistry}/download/${versionId}`);
		expect(result.origin).toBe(customRegistry);
		expect(result.pathname).toBe(`/download/${versionId}`);
	});

	test('Uses default registry when options is undefined', () => {
		const versionId = 'test-extension-v1.0.0';
		const result = constructUrl(versionId, false, undefined);

		expect(result.origin).toBe(DEFAULT_REGISTRY);
		expect(result.href).toBe(`${DEFAULT_REGISTRY}/download/${versionId}`);
	});

	test('Uses default registry when options.registry is undefined', () => {
		const versionId = 'test-extension-v1.0.0';
		const result = constructUrl(versionId, false, {});

		expect(result.origin).toBe(DEFAULT_REGISTRY);
		expect(result.href).toBe(`${DEFAULT_REGISTRY}/download/${versionId}`);
	});

	test('Combines custom registry with sandbox mode', () => {
		const versionId = 'test-extension-v1.0.0';
		const customRegistry = 'https://custom-registry.example.com';
		const result = constructUrl(versionId, true, { registry: customRegistry });

		expect(result.href).toBe(`${customRegistry}/download/${versionId}?sandbox=true`);
		expect(result.origin).toBe(customRegistry);
		expect(result.searchParams.get('sandbox')).toBe('true');
	});

	test('Handles version IDs with special characters', () => {
		const versionId = 'test-extension-v1.0.0-beta.1';
		const result = constructUrl(versionId);

		expect(result.pathname).toBe(`/download/${versionId}`);
		expect(result.href).toBe(`${DEFAULT_REGISTRY}/download/${versionId}`);
	});

	test('Handles version IDs with URL-encodable characters', () => {
		const versionId = 'test extension v1.0.0';
		const result = constructUrl(versionId);

		expect(result.pathname).toBe('/download/test%20extension%20v1.0.0');
		expect(result.href).toBe(`${DEFAULT_REGISTRY}/download/test%20extension%20v1.0.0`);
	});

	test('Handles empty version ID', () => {
		const versionId = '';
		const result = constructUrl(versionId);

		expect(result.pathname).toBe('/download/');
		expect(result.href).toBe(`${DEFAULT_REGISTRY}/download/`);
	});

	test('Handles custom registry with trailing slash', () => {
		const versionId = 'test-extension-v1.0.0';
		const customRegistry = 'https://custom-registry.example.com/';
		const result = constructUrl(versionId, false, { registry: customRegistry });

		expect(result.href).toBe(`https://custom-registry.example.com/download/${versionId}`);
		expect(result.pathname).toBe(`/download/${versionId}`);
	});

	test('Handles custom registry without protocol', () => {
		const versionId = 'test-extension-v1.0.0';
		const customRegistry = 'custom-registry.example.com';

		// This should throw an error since URL constructor requires a valid base URL
		expect(() => constructUrl(versionId, false, { registry: customRegistry })).toThrow();
	});

	test('Preserves all parameters when all options are provided', () => {
		const versionId = 'complex-extension-v2.1.0';
		const customRegistry = 'https://enterprise-registry.directus.io';
		const result = constructUrl(versionId, true, { registry: customRegistry });

		expect(result.origin).toBe(customRegistry);
		expect(result.pathname).toBe(`/download/${versionId}`);
		expect(result.searchParams.get('sandbox')).toBe('true');
		expect(result.searchParams.size).toBe(1);
		expect(result.href).toBe(`${customRegistry}/download/${versionId}?sandbox=true`);
	});

	test('Returns URL object with correct properties', () => {
		const versionId = 'test-extension-v1.0.0';
		const result = constructUrl(versionId);

		expect(result).toBeInstanceOf(URL);
		expect(typeof result.href).toBe('string');
		expect(typeof result.origin).toBe('string');
		expect(typeof result.pathname).toBe('string');
		expect(result.searchParams).toBeInstanceOf(URLSearchParams);
	});
});
