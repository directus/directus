import type { DateValue } from '@internationalized/date';

type PickerType = 'date' | 'time' | 'dateTime' | 'timestamp';

/**
 * Structural type for time values to avoid nominal typing issues.
 * Compatible with Time, CalendarDateTime, and ZonedDateTime.
 */
interface TimeStructure {
	readonly hour: number;
	readonly minute: number;
	readonly second: number;
}

/**
 * Format the v-date-picker model value to match the legacy Flatpickr formats exactly.
 *
 * Why this exists:
 * - Other parts of the app (eg `@/utils/parse-date`) parse these strings using date-fns
 * - We want the new Reka-based picker to remain fully compatible with existing expectations
 */
export function formatDatePickerModelValue(
	type: PickerType,
	{
		calendarValue,
		timeValue,
		includeSeconds,
	}: {
		calendarValue?: DateValue;
		/**
		 * Note: we use a structural interface to avoid nominal-type issues
		 * when multiple copies of `@internationalized/date` might exist.
		 */
		timeValue?: TimeStructure | null;
		includeSeconds: boolean;
	},
): string | null {
	if (type === 'date') {
		if (!calendarValue) return null;
		return calendarValue.toString(); // "yyyy-MM-dd"
	}

	if (type === 'time') {
		if (!timeValue) return null;
		// Legacy emits `HH:mm:ss` even when seconds UI is hidden (seconds become "00").
		const seconds = includeSeconds ? (timeValue.second ?? 0) : 0;
		return `${pad2(timeValue.hour)}:${pad2(timeValue.minute)}:${pad2(seconds)}`;
	}

	// dateTime / timestamp need both parts. Default time to 00:00:00 if unset (common when selecting a date first).
	if (!calendarValue) return null;

	const hour = timeValue?.hour ?? 0;
	const minute = timeValue?.minute ?? 0;
	const second = includeSeconds ? (timeValue?.second ?? 0) : 0;

	if (type === 'dateTime') {
		// Legacy emits: "yyyy-MM-dd'T'HH:mm:ss"
		return `${calendarValue.toString()}T${pad2(hour)}:${pad2(minute)}:${pad2(second)}`;
	}

	// type === 'timestamp'
	// Legacy emits: Date.toISOString() (absolute UTC timestamp)
	const jsDate = new Date(calendarValue.year, calendarValue.month - 1, calendarValue.day, hour, minute, second, 0);

	return jsDate.toISOString();
}

function pad2(value: number): string {
	return String(value).padStart(2, '0');
}
