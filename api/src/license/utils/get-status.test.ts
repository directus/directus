import { CORE_LICENSE } from '@directus/license';
import { expect, test } from 'vitest';
import { getStatus } from './get-status.js';

test('status of core license', () => {
	const result = getStatus(CORE_LICENSE);

	expect(result).toEqual('active');
});

test('status of non expired license', () => {
	const result = getStatus({
		...CORE_LICENSE,
		meta: { ...CORE_LICENSE.meta, expires_at: Math.floor(Date.now() / 1000) + 100 },
	});

	expect(result).toEqual('active');
});

test('status of expired license', () => {
	const result = getStatus({
		...CORE_LICENSE,
		meta: { ...CORE_LICENSE.meta, expires_at: Math.floor(Date.now() / 1000) - 100 },
	});

	expect(result).toEqual('expired');
});

test('status of grace period license', () => {
	const result = getStatus({
		...CORE_LICENSE,
		meta: { ...CORE_LICENSE.meta, expires_at: Math.floor(Date.now() / 1000) - 100, grace_period: 120 },
	});

	expect(result).toEqual('grace');
});

test('status of grace period expired license', () => {
	const result = getStatus({
		...CORE_LICENSE,
		meta: { ...CORE_LICENSE.meta, expires_at: Math.floor(Date.now() / 1000) - 100, grace_period: 80 },
	});

	expect(result).toEqual('expired');
});
