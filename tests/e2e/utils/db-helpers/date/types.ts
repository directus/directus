import { DatabaseHelper } from '../types.js';

export abstract class DateHelper extends DatabaseHelper {
	parse(date: string | Date): string {
		if (date instanceof Date) {
			return date.toISOString();
		}

		return date;
	}

	readTimestampString(date: string): string {
		return date;
	}

	writeTimestamp(date: string): Date {
		return new Date(date);
	}

	fieldFlagForField(fieldType: string): string {
		if (fieldType === 'json') return 'cast-json';
		return '';
	}
}
