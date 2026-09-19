import { format } from 'date-fns';
import { DateHelper } from '../types.js';

const TIME_RE = /^\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

export class DateHelperOracle extends DateHelper {
	// Required to handle timezoned offset
	override parse(date: string | Date): string {
		if (!date) {
			return date;
		}

		if (date instanceof Date) {
			return String(date.toISOString());
		}

		// Return YY-MM-DD as is for date support
		if (date.length <= 10 && date.includes('-')) {
			return date;
		}

		// Time values are stored on a fixed date (see writeTime), so compare against the local wall clock
		// of that date, which is how the session reads the column back
		if (TIME_RE.test(date)) {
			return format(this.writeTime(date), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
		}

		return String(new Date(date).toISOString());
	}

	// Oracle has no time only type, so time fields are stored as timestamps on a fixed date
	override writeTime(time: string): Date {
		return TIME_RE.test(time) ? new Date(`1970-01-01T${time}`) : new Date(NaN);
	}

	override fieldFlagForField(fieldType: string): string {
		switch (fieldType) {
			case 'json':
				return 'cast-json';
			case 'dateTime':
				return 'cast-datetime';
			case 'time':
				return 'cast-time';
			default:
				return '';
		}
	}
}
