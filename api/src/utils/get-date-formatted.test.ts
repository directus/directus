import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { getDateFormatted } from './get-date-formatted';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

test.each([
	{ utc: '2023-02-03T01:23:45.678Z', unixTimestamp: 1675387425678, expected: '20230203-12345' },
	{ utc: '2023-06-12T01:23:45.678Z', unixTimestamp: 1686533025678, expected: '20230612-12345' },
	{ utc: '2025-10-20T01:23:45.678Z', unixTimestamp: 1760923425678, expected: '20251020-12345' },
	{ utc: '2050-11-11T12:34:56.789Z', unixTimestamp: 2551782896789, expected: '20501111-123456' },
])('should format "$unixTimestamp" into "$expected"', ({ unixTimestamp, expected }) => {
	// account for timezone difference depending on the machine where this test is ran
	const now = new Date();
	const timezoneOffset = now.getTimezoneOffset() * 60 * 1000;
	const targetSystemTime = new Date(unixTimestamp).valueOf() + timezoneOffset;

	// set to the unix timestamp that is not offset by local timezone
	vi.setSystemTime(targetSystemTime);

	expect(getDateFormatted()).toBe(expected);
});
