import { DateHelper } from '../types';
import { parseISO } from 'date-fns';

export class DateHelperMySQL extends DateHelper {
	readTimestampString(date: string): string {
		const parsedDate = new Date(date);
		return new Date(parsedDate.getTime() - parsedDate.getTimezoneOffset() * 60000).toISOString();
	}

	writeTimestamp(date: string): Date {
		const parsedDate = parseISO(date);
		return new Date(parsedDate.getTime() + parsedDate.getTimezoneOffset() * 60000);
	}
}
