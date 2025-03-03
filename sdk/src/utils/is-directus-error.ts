import type { DirectusError } from '../types/error.js';

export function isDirectusError(error: unknown): error is DirectusError {
	return (
		typeof error === 'object' &&
		error !== null &&
		'errors' in error &&
		Array.isArray(error.errors) &&
		'message' in error.errors[0] &&
		'extensions' in error.errors[0] &&
		'code' in error.errors[0].extensions &&
		'response' in error
	);
}
