import { addTokenToURL } from '@/api';
import { getAssetUrl } from '@/utils/get-asset-url';
import { cryptoStub } from '@/__utils__/crypto';
import { expect, test, vi } from 'vitest';
import { getPublicURL } from '@/utils/get-root-path';
import { URL } from 'node:url';

vi.stubGlobal('crypto', cryptoStub);
vi.mock('@/utils/get-root-path');

Object.defineProperty(window, 'URL', {
	value: URL,
});

test('Get asset url', () => {
	vi.mocked(getPublicURL).mockReturnValueOnce('https://directus.io/');
	const output = getAssetUrl('test.jpg');
	expect(output).toBe(`https://directus.io${addTokenToURL('/assets/test.jpg')}`);
});

test('Get asset url for download', () => {
	vi.mocked(getPublicURL).mockReturnValueOnce('https://directus.io/');
	const output = getAssetUrl('test.jpg', true);
	expect(output).toBe(`https://directus.io${addTokenToURL('/assets/test.jpg?download=')}`);
});

test('Subdirectory Install: Get asset url', () => {
	vi.mocked(getPublicURL).mockReturnValueOnce('https://directus.io/subdirectory/');
	const output = getAssetUrl('test.jpg');
	expect(output).toBe(`https://directus.io/subdirectory${addTokenToURL('/assets/test.jpg')}`);
});

test('Subdirectory Install: Get asset url for download', () => {
	vi.mocked(getPublicURL).mockReturnValueOnce('https://directus.io/subdirectory/');
	const output = getAssetUrl('test.jpg', true);
	expect(output).toBe(`https://directus.io/subdirectory${addTokenToURL('/assets/test.jpg?download=')}`);
});
