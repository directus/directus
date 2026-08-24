import { parseISO } from 'date-fns';
import { DatabaseHelper } from '../types.js';

export abstract class DateHelper extends DatabaseHelper {
	writeTimestamp(date: string): Date {
		return parseISO(date);
	}
}
