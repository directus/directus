import localizedFormat from '@/utils/localized-format';
import { set, add, startOfWeek } from 'date-fns';

// Flatpickr locale object reference: https://github.com/flatpickr/flatpickr/blob/master/src/l10n/default.ts
export async function getFlatpickrLocale() {
	const now = new Date();
	const firstDayOfWeekForDate = startOfWeek(now);
	const weekdaysShorthand = await Promise.all(
		[...Array(7).keys()].map((_, i) => localizedFormat(add(firstDayOfWeekForDate, { days: i }), 'E'))
	);
	const weekdaysLonghand = await Promise.all(
		[...Array(7).keys()].map((_, i) => localizedFormat(add(firstDayOfWeekForDate, { days: i }), 'EEEE'))
	);
	const monthsShorthand = await Promise.all(
		[...Array(12).keys()].map((_, i) => localizedFormat(set(now, { month: i }), 'LLL'))
	);
	const monthsLonghand = await Promise.all(
		[...Array(12).keys()].map((_, i) => localizedFormat(set(now, { month: i }), 'LLLL'))
	);
	const amPM = await Promise.all([
		localizedFormat(set(now, { hours: 0, minutes: 0, seconds: 0 }), 'a'),
		localizedFormat(set(now, { hours: 23, minutes: 59, seconds: 59 }), 'a'),
	]);

	return {
		weekdays: {
			longhand: weekdaysLonghand,
			shorthand: weekdaysShorthand,
		},
		months: {
			longhand: monthsLonghand,
			shorthand: monthsShorthand,
		},
		amPM,
	};
}
