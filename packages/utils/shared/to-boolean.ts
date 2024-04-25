/**
 * Convert environment variable to Boolean
 */
export function toBoolean(value: any): boolean {
	return (typeof value === 'boolean' && value) || value === 'true' || value === true || value === '1' || value === 1;
}
