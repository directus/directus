import ms, { type StringValue } from 'ms';

/**
 * Safely parse human readable time format into milliseconds
 */
export function getMilliseconds<T = undefined>(value: unknown, fallback?: T): number | T {
	if ((typeof value !== 'string' && typeof value !== 'number') || value === '') {
		return fallback as T;
	}

	return ms(String(value) as StringValue) ?? fallback;
}
