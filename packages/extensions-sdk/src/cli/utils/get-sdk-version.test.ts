import getSdkVersion from './get-sdk-version.js';
import { afterEach, expect, test, vi } from 'vitest';

afterEach(() => {
	vi.clearAllMocks();
});

test('Returns a string for sdk version', () => {
	expect(getSdkVersion()).toEqual(expect.any(String));
});
