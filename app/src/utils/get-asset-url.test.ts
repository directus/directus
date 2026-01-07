import { expect, test, vi } from 'vitest';
import { cryptoStub } from '@/__utils__/crypto';
import { getAssetUrl } from '@/utils/get-asset-url';
import { getPublicURL } from '@/utils/get-root-path';

vi.stubGlobal('crypto', cryptoStub);
vi.mock('@/utils/get-root-path');

test('Get asset url', () => {
	vi.mocked(getPublicURL).mockReturnValueOnce('https://directus.io/');
	const output = getAssetUrl('test.jpg');
	expect(output).toBe(`https://directus.io/assets/test.jpg`);
});

test('Get asset url for download', () => {
	vi.mocked(getPublicURL).mockReturnValueOnce('https://directus.io/');
	const output = getAssetUrl('test.jpg', { isDownload: true });
	expect(output).toBe(`https://directus.io/assets/test.jpg?download=`);
});

test('Subdirectory Install: Get asset url', () => {
	vi.mocked(getPublicURL).mockReturnValueOnce('https://directus.io/subdirectory/');
	const output = getAssetUrl('test.jpg');
	expect(output).toBe(`https://directus.io/subdirectory/assets/test.jpg`);
});

test('Subdirectory Install: Get asset url for download', () => {
	vi.mocked(getPublicURL).mockReturnValueOnce('https://directus.io/subdirectory/');
	const output = getAssetUrl('test.jpg', { isDownload: true });
	expect(output).toBe(`https://directus.io/subdirectory/assets/test.jpg?download=`);
});

test('Get asset url with image key', () => {
	vi.mocked(getPublicURL).mockReturnValueOnce('https://directus.io/');
	const output = getAssetUrl('test.jpg', { imageKey: '12345' });
	expect(output).toBe(`https://directus.io/assets/test.jpg?key=12345`);
});

test('Get asset url with cache buster as date', () => {
	vi.mocked(getPublicURL).mockReturnValueOnce('https://directus.io/');
	const date = '2024-01-01T00:00:00.000Z';
	const output = getAssetUrl('test.jpg', { cacheBuster: date });
	expect(output).toBe(`https://directus.io/assets/test.jpg?v=2024-01-01T00%3A00%3A00.000Z`);
});

test('Get asset url with cache buster as true', () => {
	vi.useFakeTimers().setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
	vi.mocked(getPublicURL).mockReturnValueOnce('https://directus.io/');
	const output = getAssetUrl('test.jpg', { cacheBuster: true });
	expect(output).toBe(`https://directus.io/assets/test.jpg?v=1704067200000`);
});

test('Get asset url with custom params', () => {
	vi.mocked(getPublicURL).mockReturnValueOnce('https://directus.io/');
	const output = getAssetUrl('test.jpg', { width: 100, height: 200 });
	expect(output).toBe(`https://directus.io/assets/test.jpg?width=100&height=200`);
});
