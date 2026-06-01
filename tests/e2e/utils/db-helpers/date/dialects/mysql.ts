import { parseISO } from 'date-fns';
import { DateHelper } from '../types.js';

export class DateHelperMySQL extends DateHelper {
	override writeTimestamp(date: string): Date {
		const parsedDate = parseISO(date);
		return new Date(parsedDate.getTime() + parsedDate.getTimezoneOffset() * 60000);
	}
}
