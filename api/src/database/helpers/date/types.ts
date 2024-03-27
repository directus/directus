import { DatabaseHelper } from '../types.js';
import { parseISO } from 'date-fns';

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

	fieldFlagForField(_fieldType: string): string {
		return '';
	}
}
