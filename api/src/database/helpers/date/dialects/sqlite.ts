import { DateHelper } from '../types';

export class DateHelperSQLite extends DateHelper {
	parse(date: string): string {
		// Return the time as string
		if (date.length <= 8 && date.includes(':')) {
			return date;
		}

		// Return dates in epoch milliseconds
		return String(new Date(date).getTime());
	}

	fieldFlagForField(fieldType: string): string {
		switch (fieldType) {
			case 'timestamp':
				return 'cast-timestamp';
			default:
				return '';
		}
	}
}
