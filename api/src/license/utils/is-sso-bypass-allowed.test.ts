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

describe('locked', () => {
	test('bypasses regardless of source or grace period', async () => {
		getStatus.mockResolvedValue('locked');
		getSource.mockReturnValue('settings');

		await expect(isSSOBypassAllowed()).resolves.toBe(true);
		expect(isInCoreGracePeriod).not.toHaveBeenCalled();
	});
});

describe('grace', () => {
	test('core install (no license) within core grace period -> bypass', async () => {
		getStatus.mockResolvedValue('grace');
		getSource.mockReturnValue(null);
		isInCoreGracePeriod.mockResolvedValue(true);

		await expect(isSSOBypassAllowed()).resolves.toBe(true);
	});

	test('core install (no license) outside core grace period -> no bypass', async () => {
		getStatus.mockResolvedValue('grace');
		getSource.mockReturnValue(null);
		isInCoreGracePeriod.mockResolvedValue(false);

		await expect(isSSOBypassAllowed()).resolves.toBe(false);
	});

	test('licensed expiry-grace does not qualify (source not null)', async () => {
		getStatus.mockResolvedValue('grace');
		getSource.mockReturnValue('settings');

		await expect(isSSOBypassAllowed()).resolves.toBe(false);
		expect(isInCoreGracePeriod).not.toHaveBeenCalled();
	});
});

describe('active', () => {
	test('no bypass', async () => {
		getStatus.mockResolvedValue('active');
		getSource.mockReturnValue(null);

		await expect(isSSOBypassAllowed()).resolves.toBe(false);
		expect(isInCoreGracePeriod).not.toHaveBeenCalled();
	});
});
