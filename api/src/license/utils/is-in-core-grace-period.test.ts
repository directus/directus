import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getCoreGraceExpiresAt } from './get-core-grace-expires-at.js';
import { isInCoreGracePeriod } from './is-in-core-grace-period.js';

vi.mock('./get-core-grace-expires-at.js', () => ({
	getCoreGraceExpiresAt: vi.fn(),
	GRACE_PERIOD_MS: 30 * 24 * 60 * 60 * 1000,
}));

const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
	vi.mocked(getCoreGraceExpiresAt).mockReset();
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('isInCoreGracePeriod', () => {
	test('returns false when getCoreGraceExpiresAt returns null', async () => {
		vi.mocked(getCoreGraceExpiresAt).mockResolvedValue(null);

		await expect(isInCoreGracePeriod()).resolves.toBe(false);
	});

	test('returns true while still within 30 days', async () => {
		const fiveDaysAgoSec = Math.floor((Date.now() - 5 * DAY_MS) / 1000);
		vi.mocked(getCoreGraceExpiresAt).mockResolvedValue(fiveDaysAgoSec);

		await expect(isInCoreGracePeriod()).resolves.toBe(true);
	});

	test('returns false after 30 days have passed', async () => {
		const thirtyOneDaysAgoSec = Math.floor((Date.now() - 31 * DAY_MS) / 1000);
		vi.mocked(getCoreGraceExpiresAt).mockResolvedValue(thirtyOneDaysAgoSec);

		await expect(isInCoreGracePeriod()).resolves.toBe(false);
	});
});
