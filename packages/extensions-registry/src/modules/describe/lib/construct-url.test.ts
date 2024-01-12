import { expect, test } from 'vitest';
import { DEFAULT_REGISTRY } from '../../../constants/default-registry.js';
import { constructUrl } from './construct-url.js';

test('Defaults to default registry', () => {
	const url = constructUrl('', {});

	expect(url.protocol + '//' + url.hostname).toBe(DEFAULT_REGISTRY);
});

test('Allows overriding registry', () => {
	const url = constructUrl('', { registry: 'https://test-registry.example.com' });

	expect(url.hostname).toBe('test-registry.example.com');
});
