import { parseISO } from 'date-fns';
import { DatabaseHelper } from '../types.js';

export abstract class DateHelper extends DatabaseHelper {
	parse(date: string | Date): string {
		// Date generated from NOW()
		if (date instanceof Date) {
			return date.toISOString();
		}

		return date;
	}

	readTimestampString(date: string): string {
		return date;
	}

	writeTimestamp(date: string): Date {
		return parseISO(date);
	}

	fieldFlagForField(fieldType: string): string {
		if (fieldType === 'json') return 'cast-json';
		return '';
	}
}
