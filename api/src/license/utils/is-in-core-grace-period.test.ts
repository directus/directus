import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getCoreGraceExpiresAt } from './get-core-grace-expires-at.js';
import { isInCoreGracePeriod } from './is-in-core-grace-period.js';

vi.mock('./get-core-grace-expires-at.js', () => ({
	getCoreGraceExpiresAt: vi.fn(),
	GRACE_PERIOD_MS: 30 * 24 * 60 * 60 * 1000,
}));

const FIXED_NOW_MS = 1_735_689_600_000; // 2025-01-01T00:00:00Z
const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
	vi.useFakeTimers({ now: FIXED_NOW_MS });
	vi.mocked(getCoreGraceExpiresAt).mockReset();
});

afterEach(() => {
	vi.useRealTimers();
	vi.clearAllMocks();
});

test('no v12 migration found returns false', async () => {
	vi.mocked(getCoreGraceExpiresAt).mockResolvedValue(null);

	await expect(isInCoreGracePeriod()).resolves.toBe(false);
});

test('v12 migration within 30-day grace returns true', async () => {
	const fiveDaysAgoSec = Math.floor((FIXED_NOW_MS - 5 * DAY_MS) / 1000);
	vi.mocked(getCoreGraceExpiresAt).mockResolvedValue(fiveDaysAgoSec);

	await expect(isInCoreGracePeriod()).resolves.toBe(true);
});

test('v12 migration past 30-day grace returns false', async () => {
	const thirtyOneDaysAgoSec = Math.floor((FIXED_NOW_MS - 31 * DAY_MS) / 1000);
	vi.mocked(getCoreGraceExpiresAt).mockResolvedValue(thirtyOneDaysAgoSec);

	await expect(isInCoreGracePeriod()).resolves.toBe(false);
});
