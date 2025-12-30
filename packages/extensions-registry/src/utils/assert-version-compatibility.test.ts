import { assertVersionCompatibility } from './assert-version-compatibility.js';
import { getApiVersion } from './get-api-version.js';
import { OutOfDateError } from '@directus/errors';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('./get-api-version.js');

vi.mock('../constants.js', () => ({
	SUPPORTED_VERSION: 'test-version',
}));

afterEach(() => {
	vi.resetAllMocks();
});

test('Throws out of date error if current version is not supported', async () => {
	vi.mocked(getApiVersion).mockResolvedValue('some-other-version');

	await expect(() => assertVersionCompatibility()).rejects.toBeInstanceOf(OutOfDateError);
});

test('Does not throw when version matches', () => {
	vi.mocked(getApiVersion).mockResolvedValue('test-version');

	expect(async () => await assertVersionCompatibility()).not.toThrow();
});
