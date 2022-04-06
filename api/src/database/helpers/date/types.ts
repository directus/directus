import { DatabaseHelper } from '../types';
import { parseISO } from 'date-fns';

export abstract class DateHelper extends DatabaseHelper {
	parse(date: string): string {
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
