import { test, expect, vi } from 'vitest';

import { cryptoStub } from '@/__utils__/crypto';
vi.stubGlobal('crypto', cryptoStub);

import { addTokenToURL } from '@/api';
import { getAssetUrl } from '@/utils/get-asset-url';

test('Get asset url', () => {
	global.window.location.href = 'https://directus.io/admin/test/';
	const output = getAssetUrl('test.jpg');
	expect(output).toBe(`https://directus.io${addTokenToURL('/assets/test.jpg')}`);
});

test('Get asset url for download', () => {
	global.window.location.href = 'https://directus.io/admin/test/';
	const output = getAssetUrl('test.jpg', true);
	expect(output).toBe(`https://directus.io${addTokenToURL('/assets/test.jpg?download=')}`);
});

test('Subdirectory Install: Get asset url', () => {
	global.window.location.href = 'https://directus.io/subdirectory/admin/test/';
	const output = getAssetUrl('test.jpg');
	expect(output).toBe(`https://directus.io/subdirectory${addTokenToURL('/assets/test.jpg')}`);
});

test('Subdirectory Install: Get asset url for download', () => {
	global.window.location.href = 'https://directus.io/subdirectory/admin/test/';
	const output = getAssetUrl('test.jpg', true);
	expect(output).toBe(`https://directus.io/subdirectory${addTokenToURL('/assets/test.jpg?download=')}`);
});
