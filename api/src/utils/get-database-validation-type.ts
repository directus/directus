import type { ClientFilterOperator } from '@directus/types';

/**
 * Maps database error codes to validation types
 * Used when database errors don't include validation type information.
 *
 * This utility is used across import operations to provide consistent
 * error type mapping for all formats (CSV, JSON, XML, YAML, etc.).
 *
 * @param errorCode - The database error code (e.g., 'INVALID_FOREIGN_KEY')
 * @param extensions - Optional error extensions that might contain a type
 * @returns The validation type for frontend translation
 */
export function getDatabaseValidationType(errorCode: string, extensions?: any): ClientFilterOperator | string {
	switch (errorCode) {
		case 'INVALID_FOREIGN_KEY':
			return 'foreign_key';
		case 'NOT_NULL_VIOLATION':
			return 'nnull';
		case 'RECORD_NOT_UNIQUE':
			return 'unique';
		case 'VALUE_OUT_OF_RANGE':
			return 'out_of_range';
		case 'VALUE_TOO_LONG':
			return 'too_long';
		case 'CONTAINS_NULL_VALUES':
			return 'nnull';
		default:
			// Fallback to existing type from extensions or 'required'
			return (extensions?.type as ClientFilterOperator) || 'required';
	}
}
