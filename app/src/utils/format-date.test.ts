import { describe, test, expect, vi, beforeAll, afterAll } from 'vitest';
import { createI18n } from 'vue-i18n';
import { formatDate, FormatDateOptions } from '@/utils/format-date';
import { format as formatDateFns } from 'date-fns';

vi.mock('@/lang', () => {
	return {
		i18n: createI18n({
			legacy: false,
			locale: 'en-US',
			messages: {
				'en-US': {
					'date-fns_date': 'PPP',
					'date-fns_time': 'h:mm:ss a',
					'date-fns_time_no_seconds': 'h:mm a',
					'date-fns_time_24hour': 'HH:mm:ss',
					'date-fns_time_no_seconds_24hour': 'HH:mm',
					'date-fns_date_short': 'MMM d, u',
					'date-fns_time_short': 'h:mma',
					'date-fns_time_short_seconds': 'h:mm:ssa',
					'date-fns_date_short_no_year': 'MMM d',
				},
			},
		}),
	};
});

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

describe('formatDate - Relative Formatting', () => {
	const relativeTestCases = [
		{
			relative: true,
			strict: false,
			suffix: true,
			expected: 'less than a minute ago',
			description: 'relative: true, strict: false, suffix: true',
		},
		{
			relative: true,
			strict: false,
			suffix: false,
			expected: 'less than a minute',
			description: 'relative: true, strict: false, suffix: false',
		},
		{
			relative: true,
			strict: true,
			suffix: true,
			round: 'floor',
			expected: '0 seconds ago',
			description: 'relative: true, strict: true, suffix: true, round: floor',
		},
		{
			relative: true,
			strict: true,
			suffix: false,
			round: 'ceil',
			expected: '0 seconds',
			description: 'relative: true, strict: true, suffix: false, round: ceil',
		},
		{
			relative: true,
			strict: true,
			suffix: true,
			round: 'round',
			expected: '0 seconds ago',
			description: 'relative: true, strict: true, suffix: true, round: round',
		},
	];

	test.each(relativeTestCases)(
		'should display "$expected" for $description',
		({ relative, strict, suffix, round, expected }) => {
			const now = getCurrentTestDate();
			vi.setSystemTime(now.valueOf());

			const options: FormatDateOptions = {
				type: 'timestamp',
				relative,
				strict: strict ?? false,
				suffix: suffix ?? false,
				round: round as 'floor' | 'round' | 'ceil' | undefined,
			};

			const result = formatDate(now.toISOString(), options);

			expect(result).toBe(expected);
		},
	);
});

describe('formatDate - Absolute Formatting', () => {
	const absoluteTestCases = [
		{
			type: 'dateTime',
			format: 'long',
			includeSeconds: false,
			use24: false,
			expected: 'January 1st, 2023 12:00 AM',
			description: 'type: dateTime, format: long, includeSeconds: false, use24: false',
		},
		{
			type: 'dateTime',
			format: 'short',
			includeSeconds: false,
			use24: false,
			expected: 'Jan 1, 2023 12:00AM',
			description: 'type: dateTime, format: short, includeSeconds: false, use24: false',
		},
		{
			type: 'dateTime',
			format: 'long',
			includeSeconds: true,
			use24: false,
			expected: 'January 1st, 2023 12:00:00 AM',
			description: 'type: dateTime, format: long, includeSeconds: true, use24: false',
		},
		{
			type: 'dateTime',
			format: 'long',
			includeSeconds: false,
			use24: true,
			expected: 'January 1st, 2023 00:00',
			description: 'type: dateTime, format: long, includeSeconds: false, use24: true',
		},
		{
			type: 'dateTime',
			format: 'long',
			includeSeconds: true,
			use24: true,
			expected: 'January 1st, 2023 00:00:00',
			description: 'type: dateTime, format: long, includeSeconds: true, use24: true',
		},
		{
			type: 'date',
			format: 'long',
			includeSeconds: false,
			use24: false,
			expected: 'January 1st, 2023',
			description: 'type: date, format: long',
		},
		{
			type: 'date',
			format: 'short',
			includeSeconds: false,
			use24: false,
			expected: 'Jan 1, 2023',
			description: 'type: date, format: short',
		},
		{
			type: 'date',
			format: 'long',
			includeSeconds: true,
			use24: false,
			expected: 'January 1st, 2023',
			description: 'type: date, format: long, includeSeconds: true',
		},
		{
			type: 'date',
			format: 'short',
			includeSeconds: false,
			use24: true,
			expected: 'Jan 1, 2023',
			description: 'type: date, format: short, use24: true',
		},
		{
			type: 'time',
			format: 'long',
			includeSeconds: false,
			use24: false,
			expected: '12:00 AM',
			description: 'type: time, format: long, includeSeconds: false, use24: false',
		},
		{
			type: 'time',
			format: 'short',
			includeSeconds: false,
			use24: false,
			expected: '12:00AM',
			description: 'type: time, format: short, includeSeconds: false, use24: false',
		},
		{
			type: 'time',
			format: 'long',
			includeSeconds: true,
			use24: false,
			expected: '12:00:00 AM',
			description: 'type: time, format: long, includeSeconds: true, use24: false',
		},
		{
			type: 'time',
			format: 'short',
			includeSeconds: true,
			use24: false,
			expected: '12:00:00AM',
			description: 'type: time, format: short, includeSeconds: true, use24: false',
		},
		{
			type: 'time',
			format: 'long',
			includeSeconds: false,
			use24: true,
			expected: '00:00',
			description: 'type: time, format: long, includeSeconds: false, use24: true',
		},
		{
			type: 'time',
			format: 'short',
			includeSeconds: false,
			use24: true,
			expected: '00:00',
			description: 'type: time, format: short, includeSeconds: false, use24: true',
		},
		{
			type: 'time',
			format: 'short',
			includeSeconds: true,
			use24: true,
			expected: '00:00:00',
			description: 'type: time, format: short, includeSeconds: true, use24: true',
		},
		{
			type: 'timestamp',
			format: 'MM/dd/yyyy',
			includeSeconds: false,
			use24: false,
			expected: '01/01/2023',
			description: 'type: timestamp, custom format',
		},
		{
			type: 'dateTime',
			format: 'yyyy-MM-dd HH:mm',
			includeSeconds: false,
			use24: true,
			expected: '2023-01-01 00:00',
			description: 'custom format string',
		},
		{
			type: 'dateTime',
			format: undefined,
			includeSeconds: false,
			use24: false,
			expected: 'January 1st, 2023 12:00 AM',
			description: 'format: undefined, fallback to long',
		},
		{
			type: 'date',
			format: undefined,
			includeSeconds: false,
			use24: false,
			expected: 'January 1st, 2023',
			description: 'type: date, format: undefined, fallback to long',
		},
		{
			type: 'time',
			format: undefined,
			includeSeconds: false,
			use24: false,
			expected: '12:00 AM',
			description: 'type: time, format: undefined, fallback to long',
		},
		{
			type: 'timestamp',
			format: undefined,
			includeSeconds: false,
			use24: false,
			expected: 'January 1st, 2023 12:00 AM',
			description: 'type: timestamp, format: undefined, fallback to long',
		},
	] as const;

	test.each(absoluteTestCases)(
		'should display "$expected" for $description',
		({ type, format, includeSeconds, use24, expected }) => {
			const now = getCurrentTestDate();
			vi.setSystemTime(now.valueOf());

			let dateString;

			if (type === 'timestamp') {
				dateString = now.toISOString();
			} else if (type === 'dateTime') {
				dateString = formatDateFns(now, "yyyy-MM-dd'T'HH:mm:ss");
			} else if (type === 'date') {
				dateString = formatDateFns(now, 'yyyy-MM-dd');
			} else {
				dateString = formatDateFns(now, 'HH:mm:ss');
			}

			const options: FormatDateOptions = {
				type,
				format: format as string | undefined,
				relative: false,
				includeSeconds,
				use24,
			};

			const result = formatDate(dateString, options);

			expect(result).toBe(expected);
		},
	);
});
