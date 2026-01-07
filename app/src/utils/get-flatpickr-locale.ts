import { add, set, startOfWeek } from 'date-fns';
import { localizedFormat } from '@/utils/localized-format';

// Flatpickr locale object reference: https://github.com/flatpickr/flatpickr/blob/master/src/l10n/default.ts
export function getFlatpickrLocale() {
	const now = new Date();

	const firstDayOfWeekForDate = startOfWeek(now);

	const weekdaysShorthand = [...Array(7).keys()].map((_, i) =>
		localizedFormat(add(firstDayOfWeekForDate, { days: i }), 'E'),
	);

	const weekdaysLonghand = [...Array(7).keys()].map((_, i) =>
		localizedFormat(add(firstDayOfWeekForDate, { days: i }), 'EEEE'),
	);

	const monthsShorthand = [...Array(12).keys()].map((_, i) => localizedFormat(set(now, { month: i }), 'LLL'));

	const monthsLonghand = [...Array(12).keys()].map((_, i) => localizedFormat(set(now, { month: i }), 'LLLL'));

	const amPM = [
		localizedFormat(set(now, { hours: 0, minutes: 0, seconds: 0 }), 'a'),
		localizedFormat(set(now, { hours: 23, minutes: 59, seconds: 59 }), 'a'),
	];

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
