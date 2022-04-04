import { DatabaseHelper } from '../types';

export abstract class DateHelper extends DatabaseHelper {
	parse(date: string): string {
		return date;
	}
}
