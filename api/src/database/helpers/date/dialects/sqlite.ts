import { DateHelper } from '../types.js';

export class DateHelperSQLite extends DateHelper {
	override parse(date: string | Date): string {
		if (!date) {
			return date;
		}

		// Date generated from NOW()
		if (date instanceof Date) {
			return String(date.getTime());
		}

		// Return the time as string
		if (date.length <= 8 && date.includes(':')) {
			return date;
		}

		// Return dates in epoch milliseconds
		return String(new Date(date).getTime());
	}

	override fieldFlagForField(fieldType: string): string {
		switch (fieldType) {
			case 'timestamp':
				return 'cast-timestamp';
			default:
				return '';
		}
	}
}
