import { beforeEach, describe, expect, test, vi } from 'vitest';
import { isSSOBypassAllowed } from './is-sso-bypass-allowed.js';

const getStatus = vi.fn<() => Promise<string>>();
const getSource = vi.fn<() => string | null>();
const isInCoreGracePeriod = vi.fn<() => Promise<boolean>>();

vi.mock('../manager.js', () => ({
	getLicenseManager: () => ({ getStatus, getSource }),
}));

vi.mock('./is-in-core-grace-period.js', () => ({
	isInCoreGracePeriod: () => isInCoreGracePeriod(),
}));

beforeEach(() => {
	getStatus.mockReset();
	getSource.mockReset();
	isInCoreGracePeriod.mockReset();
});

test('locked status regardless of source or grace period returns true', async () => {
	getStatus.mockResolvedValue('locked');
	getSource.mockReturnValue('settings');

	await expect(isSSOBypassAllowed()).resolves.toBe(true);
	expect(isInCoreGracePeriod).not.toHaveBeenCalled();
});

describe('grace status', () => {
	test('core plan within grace period returns true', async () => {
		getStatus.mockResolvedValue('grace');
		getSource.mockReturnValue(null);
		isInCoreGracePeriod.mockResolvedValue(true);

		await expect(isSSOBypassAllowed()).resolves.toBe(true);
	});

	test('non-core plan within grace returns false', async () => {
		getStatus.mockResolvedValue('grace');
		getSource.mockReturnValue('settings');

		await expect(isSSOBypassAllowed()).resolves.toBe(false);
		expect(isInCoreGracePeriod).not.toHaveBeenCalled();
	});
});

test('active status regardless of source returns false', async () => {
	getStatus.mockResolvedValue('active');
	getSource.mockReturnValue(null);

	await expect(isSSOBypassAllowed()).resolves.toBe(false);
	expect(isInCoreGracePeriod).not.toHaveBeenCalled();
});
