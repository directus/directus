import { getDateTimeFormatted } from './get-date-time-formatted.js';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

function getUtcDateForString(date: string) {
	const now = new Date(date);

	// account for timezone difference depending on the machine where this test is ran
	const timezoneOffsetInMinutes = now.getTimezoneOffset();
	const timezoneOffsetInMilliseconds = timezoneOffsetInMinutes * 60 * 1000;
	const nowUTC = new Date(now.valueOf() + timezoneOffsetInMilliseconds);

	return nowUTC;
}

test.each([
	{ utc: '2023-01-01T01:23:45.678Z', expected: '20230101-12345' },
	{ utc: '2023-01-11T01:23:45.678Z', expected: '20230111-12345' },
	{ utc: '2023-11-01T01:23:45.678Z', expected: '20231101-12345' },
	{ utc: '2023-11-11T12:34:56.789Z', expected: '20231111-123456' },
	{ utc: '2023-06-01T01:23:45.678Z', expected: '20230601-12345' },
	{ utc: '2023-06-11T12:34:56.789Z', expected: '20230611-123456' },
])('should format $utc into "$expected"', ({ utc, expected }) => {
	const nowUTC = getUtcDateForString(utc);

	vi.setSystemTime(nowUTC);

	expect(getDateTimeFormatted()).toBe(expected);
});
