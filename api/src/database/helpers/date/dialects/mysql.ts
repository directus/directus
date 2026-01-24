import { parseISO } from 'date-fns';
import { DateHelper } from '../types.js';

export class DateHelperMySQL extends DateHelper {
	override readTimestampString(date: string): string {
		const parsedDate = new Date(date);
		return new Date(parsedDate.getTime() - parsedDate.getTimezoneOffset() * 60000).toISOString();
	}

	override writeTimestamp(date: string): Date {
		const parsedDate = parseISO(date);
		return new Date(parsedDate.getTime() + parsedDate.getTimezoneOffset() * 60000);
	}
}
