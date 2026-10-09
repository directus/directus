import { expect, test } from 'vitest';
import { replaceUrlAccessToken } from './replace-url-access-token';
import { getPublicURL } from '@/utils/get-root-path';

const assetUrl = getPublicURL() + 'assets/abc';

test('sets the token on asset URLs', () => {
	expect(replaceUrlAccessToken(assetUrl, 'tok')).toBe(assetUrl + '?access_token=tok');
});

test('replaces an existing token', () => {
	expect(replaceUrlAccessToken(assetUrl + '?access_token=old', 'new')).toBe(assetUrl + '?access_token=new');
});

test('removes the token when none is provided', () => {
	expect(replaceUrlAccessToken(assetUrl + '?access_token=old&key=thumb', null)).toBe(assetUrl + '?key=thumb');
	expect(replaceUrlAccessToken(assetUrl + '?access_token=old', undefined)).toBe(assetUrl);
});

test('leaves non-asset URLs untouched', () => {
	expect(replaceUrlAccessToken('https://example.com/video.mp4', 'tok')).toBe('https://example.com/video.mp4');
});
