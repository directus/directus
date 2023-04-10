import type { FieldFunction } from '@directus/types';
import { getDate, getDay, getWeek, parseISO } from 'date-fns';

export const functions: Record<FieldFunction, (val: any) => any> = {
	year,
	month,
	week,
	day,
	weekday,
	hour,
	minute,
	second,
	count,
};

/**
 * Extract the year from a given ISO-8601 date
 */
function year(value: string): number {
	return parseISO(value).getUTCFullYear();
}

function month(value: string): number {
	// Match DB by using 1-indexed months
	return parseISO(value).getUTCMonth() + 1;
}

function week(value: string): number {
	return getWeek(parseISO(value));
}

function day(value: string): number {
	return getDate(parseISO(value));
}

function weekday(value: string): number {
	return getDay(parseISO(value));
}

function hour(value: string): number {
	return parseISO(value).getUTCHours();
}

function minute(value: string): number {
	return parseISO(value).getUTCMinutes();
}

function second(value: string): number {
	return parseISO(value).getUTCSeconds();
}

function count(value: any): number | null {
	return Array.isArray(value) ? value.length : null;
}
