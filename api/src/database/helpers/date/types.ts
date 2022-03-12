import { DatabaseHelper } from '../types';
import { Knex } from 'knex';
import { parseISO } from 'date-fns';

export abstract class DateHelper extends DatabaseHelper {
	abstract year(table: string, column: string): Knex.Raw;
	abstract month(table: string, column: string): Knex.Raw;
	abstract week(table: string, column: string): Knex.Raw;
	abstract day(table: string, column: string): Knex.Raw;
	abstract weekday(table: string, column: string): Knex.Raw;
	abstract hour(table: string, column: string): Knex.Raw;
	abstract minute(table: string, column: string): Knex.Raw;
	abstract second(table: string, column: string): Knex.Raw;
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
