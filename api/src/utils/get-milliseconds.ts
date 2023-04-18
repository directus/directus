import ms from 'ms';

/**
 * Safely parse human readable time format into milliseconds
 */
export function getMilliseconds<T>(value: unknown, fallback?: T): number | T;
export function getMilliseconds(value: unknown, fallback = undefined): number | undefined {
	if ((typeof value !== 'string' && typeof value !== 'number') || value === '') {
		return fallback;
	}

	return ms(String(value)) ?? fallback;
}
