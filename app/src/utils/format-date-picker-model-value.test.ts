import { CalendarDate, Time } from '@internationalized/date';
import { describe, expect, test } from 'vitest';
import { formatDatePickerModelValue } from './format-date-picker-model-value';

describe('format-date-picker-model-value', () => {
	describe('date type', () => {
		test('returns formatted date string for valid CalendarDate', () => {
			const calendarValue = new CalendarDate(2024, 1, 15);

			const result = formatDatePickerModelValue('date', {
				calendarValue,
				includeSeconds: false,
			});

			expect(result).toBe('2024-01-15');
		});

		test('returns null when calendarValue is undefined', () => {
			const result = formatDatePickerModelValue('date', {
				calendarValue: undefined,
				includeSeconds: false,
			});

			expect(result).toBe(null);
		});

		test('formats different dates correctly', () => {
			const testCases = [
				{ date: new CalendarDate(2024, 12, 31), expected: '2024-12-31' },
				{ date: new CalendarDate(2023, 3, 5), expected: '2023-03-05' },
				{ date: new CalendarDate(2025, 7, 20), expected: '2025-07-20' },
			];

			testCases.forEach(({ date, expected }) => {
				const result = formatDatePickerModelValue('date', {
					calendarValue: date,
					includeSeconds: false,
				});

				expect(result).toBe(expected);
			});
		});
	});

	describe('time type', () => {
		test('returns formatted time string with seconds', () => {
			const timeValue = new Time(14, 30, 45);

			const result = formatDatePickerModelValue('time', {
				timeValue,
				includeSeconds: true,
			});

			expect(result).toBe('14:30:45');
		});

		test('returns formatted time with 00 seconds when includeSeconds is false', () => {
			const timeValue = new Time(14, 30, 45);

			const result = formatDatePickerModelValue('time', {
				timeValue,
				includeSeconds: false,
			});

			expect(result).toBe('14:30:00');
		});

		test('returns null when timeValue is undefined', () => {
			const result = formatDatePickerModelValue('time', {
				timeValue: undefined,
				includeSeconds: true,
			});

			expect(result).toBe(null);
		});

		test('returns null when timeValue is null', () => {
			const result = formatDatePickerModelValue('time', {
				timeValue: null,
				includeSeconds: true,
			});

			expect(result).toBe(null);
		});

		test('pads single-digit hours, minutes, and seconds', () => {
			const timeValue = new Time(9, 5, 3);

			const result = formatDatePickerModelValue('time', {
				timeValue,
				includeSeconds: true,
			});

			expect(result).toBe('09:05:03');
		});

		test('handles midnight (00:00:00)', () => {
			const timeValue = new Time(0, 0, 0);

			const result = formatDatePickerModelValue('time', {
				timeValue,
				includeSeconds: true,
			});

			expect(result).toBe('00:00:00');
		});

		test('handles max time (23:59:59)', () => {
			const timeValue = new Time(23, 59, 59);

			const result = formatDatePickerModelValue('time', {
				timeValue,
				includeSeconds: true,
			});

			expect(result).toBe('23:59:59');
		});
	});

	describe('dateTime type', () => {
		test('returns formatted dateTime string with time', () => {
			const calendarValue = new CalendarDate(2024, 1, 15);
			const timeValue = new Time(14, 30, 45);

			const result = formatDatePickerModelValue('dateTime', {
				calendarValue,
				timeValue,
				includeSeconds: true,
			});

			expect(result).toBe('2024-01-15T14:30:45');
		});

		test('defaults to 00:00:00 when timeValue is undefined', () => {
			const calendarValue = new CalendarDate(2024, 1, 15);

			const result = formatDatePickerModelValue('dateTime', {
				calendarValue,
				timeValue: undefined,
				includeSeconds: true,
			});

			expect(result).toBe('2024-01-15T00:00:00');
		});

		test('defaults to 00:00:00 when timeValue is null', () => {
			const calendarValue = new CalendarDate(2024, 1, 15);

			const result = formatDatePickerModelValue('dateTime', {
				calendarValue,
				timeValue: null,
				includeSeconds: true,
			});

			expect(result).toBe('2024-01-15T00:00:00');
		});

		test('forces seconds to 00 when includeSeconds is false', () => {
			const calendarValue = new CalendarDate(2024, 1, 15);
			const timeValue = new Time(14, 30, 45);

			const result = formatDatePickerModelValue('dateTime', {
				calendarValue,
				timeValue,
				includeSeconds: false,
			});

			expect(result).toBe('2024-01-15T14:30:00');
		});

		test('returns null when calendarValue is undefined', () => {
			const timeValue = new Time(14, 30, 45);

			const result = formatDatePickerModelValue('dateTime', {
				calendarValue: undefined,
				timeValue,
				includeSeconds: true,
			});

			expect(result).toBe(null);
		});

		test('handles partial time values correctly', () => {
			const calendarValue = new CalendarDate(2024, 1, 15);
			const timeValue = { hour: 9, minute: 5, second: 0 };

			const result = formatDatePickerModelValue('dateTime', {
				calendarValue,
				timeValue,
				includeSeconds: true,
			});

			expect(result).toBe('2024-01-15T09:05:00');
		});
	});

	describe('timestamp type', () => {
		test('returns ISO string for valid calendar and time', () => {
			const calendarValue = new CalendarDate(2024, 1, 15);
			const timeValue = new Time(14, 30, 45);

			const result = formatDatePickerModelValue('timestamp', {
				calendarValue,
				timeValue,
				includeSeconds: true,
			});

			// Verify it's a valid ISO string
			expect(result).toBeTruthy();
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
			expect(new Date(result!).toISOString()).toBe(result);
		});

		test('defaults to 00:00:00 when timeValue is undefined', () => {
			const calendarValue = new CalendarDate(2024, 1, 15);

			const result = formatDatePickerModelValue('timestamp', {
				calendarValue,
				timeValue: undefined,
				includeSeconds: true,
			});

			// Creates a Date with local time 2024-01-15 00:00:00, then converts to UTC ISO
			// The result will be timezone-dependent, so we just verify it's a valid ISO string
			expect(result).toBeTruthy();
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
			expect(new Date(result!).toISOString()).toBe(result);
		});

		test('handles includeSeconds false by setting seconds to 0', () => {
			const calendarValue = new CalendarDate(2024, 1, 15);
			const timeValue = new Time(14, 30, 45);

			const result = formatDatePickerModelValue('timestamp', {
				calendarValue,
				timeValue,
				includeSeconds: false,
			});

			// Should have seconds as 00 (timezone may shift the date)
			expect(result).toBeTruthy();
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\.\d{3}Z$/);
		});

		test('returns null when calendarValue is undefined', () => {
			const timeValue = new Time(14, 30, 45);

			const result = formatDatePickerModelValue('timestamp', {
				calendarValue: undefined,
				timeValue,
				includeSeconds: true,
			});

			expect(result).toBe(null);
		});

		test('produces valid UTC timestamp', () => {
			const calendarValue = new CalendarDate(2024, 6, 15);
			const timeValue = new Time(12, 0, 0);

			const result = formatDatePickerModelValue('timestamp', {
				calendarValue,
				timeValue,
				includeSeconds: true,
			});

			// Verify it's a valid date that can be parsed
			const parsed = new Date(result!);
			expect(parsed.getFullYear()).toBe(2024);
			expect(parsed.getMonth()).toBe(5); // June is month 5 (0-indexed)
			expect(parsed.getDate()).toBe(15);
		});
	});

	describe('edge cases', () => {
		test('handles leap year date correctly', () => {
			const calendarValue = new CalendarDate(2024, 2, 29);

			const result = formatDatePickerModelValue('date', {
				calendarValue,
				includeSeconds: false,
			});

			expect(result).toBe('2024-02-29');
		});

		test('handles end of year date', () => {
			const calendarValue = new CalendarDate(2024, 12, 31);
			const timeValue = new Time(23, 59, 59);

			const result = formatDatePickerModelValue('dateTime', {
				calendarValue,
				timeValue,
				includeSeconds: true,
			});

			expect(result).toBe('2024-12-31T23:59:59');
		});

		test('handles beginning of year date', () => {
			const calendarValue = new CalendarDate(2024, 1, 1);
			const timeValue = new Time(0, 0, 0);

			const result = formatDatePickerModelValue('dateTime', {
				calendarValue,
				timeValue,
				includeSeconds: true,
			});

			expect(result).toBe('2024-01-01T00:00:00');
		});
	});
});
