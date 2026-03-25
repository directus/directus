import { format as formatDateFns } from 'date-fns';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { formatDate, FormatDateOptions } from '@/utils/format-date';

beforeAll(() => {
	vi.useFakeTimers();
});

afterAll(() => {
	vi.useRealTimers();
});

function getCurrentTestDate() {
	const isoTestDate = '2023-01-01T00:00:00.000Z';

	// account for timezone difference depending on the machine where this test is ran
	const now = new Date(isoTestDate);
	const timezoneOffsetInMinutes = now.getTimezoneOffset();
	const timezoneOffsetInMilliseconds = timezoneOffsetInMinutes * 60 * 1000;
	const nowUTC = new Date(new Date(isoTestDate).valueOf() + timezoneOffsetInMilliseconds);

	return nowUTC;
}

describe('relative formatting', () => {
	const relativeTestCases: { options: Omit<FormatDateOptions, 'type'>; expected: string }[] = [
		{
			options: {
				relative: true,
				suffix: true,
			},
			expected: 'less than a minute ago',
		},
		{
			options: {
				relative: true,
			},
			expected: 'less than a minute',
		},
		{
			options: {
				relative: true,
				strict: true,
				suffix: true,
				round: 'floor',
			},
			expected: '0 seconds ago',
		},
		{
			options: {
				relative: true,
				strict: true,
				round: 'ceil',
			},
			expected: '0 seconds',
		},
		{
			options: {
				relative: true,
				strict: true,
				suffix: true,
				round: 'round',
			},
			expected: '0 seconds ago',
		},
	];

	test.each(relativeTestCases)('should display $expected for $options', ({ options, expected }) => {
		const now = getCurrentTestDate();
		vi.setSystemTime(now.valueOf());

		const result = formatDate(now.toISOString(), {
			type: 'timestamp',
			...options,
		});

		expect(result).toBe(expected);
	});
});

describe('absolute formatting', () => {
	const absoluteTestCases: { options: FormatDateOptions; expected: string }[] = [
		{
			options: {
				type: 'dateTime',
			},
			expected: 'January 1st, 2023 12:00 AM',
		},
		{
			options: {
				type: 'dateTime',
				format: 'long',
			},
			expected: 'January 1st, 2023 12:00 AM',
		},
		{
			options: {
				type: 'dateTime',
				format: 'short',
			},
			expected: 'Jan 1, 2023 12:00AM',
		},
		{
			options: {
				type: 'dateTime',
				format: 'long',
				includeSeconds: true,
			},
			expected: 'January 1st, 2023 12:00:00 AM',
		},
		{
			options: {
				type: 'dateTime',
				format: 'long',
				use24: true,
			},
			expected: 'January 1st, 2023 00:00',
		},
		{
			options: {
				type: 'dateTime',
				format: 'long',
				includeSeconds: true,
				use24: true,
			},
			expected: 'January 1st, 2023 00:00:00',
		},
		{
			options: {
				type: 'dateTime',
				format: 'yyyy-MM-dd HH:mm',
			},
			expected: '2023-01-01 00:00',
		},
		{
			options: {
				type: 'date',
			},
			expected: 'January 1st, 2023',
		},
		{
			options: {
				type: 'date',
				format: 'long',
			},
			expected: 'January 1st, 2023',
		},
		{
			options: {
				type: 'date',
				format: 'short',
			},
			expected: 'Jan 1, 2023',
		},
		{
			options: {
				type: 'time',
			},
			expected: '12:00 AM',
		},
		{
			options: {
				type: 'time',
				format: 'long',
			},
			expected: '12:00 AM',
		},
		{
			options: {
				type: 'time',
				format: 'short',
			},
			expected: '12:00AM',
		},
		{
			options: {
				type: 'time',
				format: 'long',
				includeSeconds: true,
			},
			expected: '12:00:00 AM',
		},
		{
			options: {
				type: 'time',
				format: 'short',
				includeSeconds: true,
			},
			expected: '12:00:00AM',
		},
		{
			options: {
				type: 'time',
				format: 'long',
				use24: true,
			},
			expected: '00:00',
		},
		{
			options: {
				type: 'time',
				format: 'short',
				use24: true,
			},
			expected: '00:00',
		},
		{
			options: {
				type: 'time',
				format: 'short',
				includeSeconds: true,
				use24: true,
			},
			expected: '00:00:00',
		},
		{
			options: {
				type: 'timestamp',
			},
			expected: 'January 1st, 2023 12:00 AM',
		},
		{
			options: {
				type: 'timestamp',
				format: 'MM/dd/yyyy',
			},
			expected: '01/01/2023',
		},
	];

	test.each(absoluteTestCases)('should display $expected for $options', ({ options, expected }) => {
		const now = getCurrentTestDate();
		vi.setSystemTime(now.valueOf());

		let dateString;

		if (options.type === 'timestamp') {
			dateString = now.toISOString();
		} else if (options.type === 'dateTime') {
			dateString = formatDateFns(now, "yyyy-MM-dd'T'HH:mm:ss");
		} else if (options.type === 'date') {
			dateString = formatDateFns(now, 'yyyy-MM-dd');
		} else {
			dateString = formatDateFns(now, 'HH:mm:ss');
		}

		const result = formatDate(dateString, options);

		expect(result).toBe(expected);
	});
});
