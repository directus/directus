import { ServiceUnavailableError } from '@directus/errors';
import { TimeoutError } from 'ky';

/**
 * Type guard to check if a value is an Error instance.
 */
function isError(error: unknown): error is Error {
	return error instanceof Error;
}

/**
 * Handles errors and converts them to appropriate Directus error types.
 *
 * @param error - The error to handle
 * @param handler - Optional custom error handler function that may transform the error
 * @throws Re-throws the error after potential transformation
 */
export function handleError(error: unknown, handler?: (error: Error) => void): never {
	const err = isError(error) ? error : new Error(String(error));

	if (handler) {
		handler(err);
	}

	throw err;
}

/**
 * Handles registry-specific errors and converts network/timeout errors
 * to user-friendly ServiceUnavailableError responses.
 *
 * @param error - The error caught from a registry API call
 * @throws {ServiceUnavailableError} When the error is a timeout or network error
 * @throws {Error} Re-throws the original error if it's not a network/timeout error
 */
export function handleRegistryError(error: unknown): never {
	return handleError(error, (err) => {
		if (err instanceof TimeoutError) {
			throw new ServiceUnavailableError({
				service: 'Marketplace Registry',
				reason: 'The registry server is not responding',
			});
		}

		// Check for network errors (fetch errors that aren't HTTP errors)
		if (err.name === 'TypeError' && err.message.includes('fetch')) {
			throw new ServiceUnavailableError({
				service: 'Marketplace Registry',
				reason: 'Unable to connect to the registry server',
			});
		}
	});
}

