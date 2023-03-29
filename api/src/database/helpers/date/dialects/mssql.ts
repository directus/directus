import { DateHelper } from '../types';
import { parseISO } from 'date-fns';

export class DateHelperMSSQL extends DateHelper {
	override writeTimestamp(date: string): Date {
		const parsedDate = parseISO(date);
		return new Date(parsedDate.getTime() + parsedDate.getTimezoneOffset() * 60000);
	}
}
