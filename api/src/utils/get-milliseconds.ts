import ms from 'ms';

/**
 * Get milliseconds from a human readable time format with a fallback of 0 for invalid values
 */
export default function getMilliseconds(value: unknown) {
	return ms(String(value || 0) || '0') ?? 0;
}
