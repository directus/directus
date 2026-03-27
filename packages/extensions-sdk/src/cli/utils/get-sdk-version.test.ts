import { afterEach, expect, test, vi } from 'vite-plus/test';
import getSdkVersion from './get-sdk-version.js';

afterEach(() => {
	vi.clearAllMocks();
});

test('Returns a string for sdk version', () => {
	expect(getSdkVersion()).toEqual(expect.any(String));
});
