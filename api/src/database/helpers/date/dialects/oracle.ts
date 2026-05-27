import { DateHelper } from '../types.js';

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

		return String(new Date(date).toISOString());
	}

	override fieldFlagForField(fieldType: string): string {
		switch (fieldType) {
			case 'json':
				return 'cast-json';
			case 'dateTime':
				return 'cast-datetime';
			default:
				return '';
		}
	}
}
