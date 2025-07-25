import { isDirectusError, type DirectusError } from '@directus/errors';

/**
 * Format a success response for the MCP server.
 * @param data - The data to format.
 * @param message - The message to send to the user.
 * @returns The formatted success response.
 */
export const formatSuccessResponse = (data: unknown, message?: string) => {
	if (message) {
		const formatted = `<data>\n${JSON.stringify(data, null, 2)}\n</data>\n<message>\n${message}\n</message>`;
		return {
			content: [{ type: 'text' as const, text: `${formatted}` }],
		};
	}

	return {
		content: [{ type: 'text' as const, text: `${JSON.stringify(data, null, 2)}` }],
	};
};

/**
 * Format an error response for the MCP server.
 * @param error - The error to format.
 */
export const formatErrorResponse = (error: unknown) => {
	let errorPayload: Record<string, unknown>;

	if (isDirectusError(error)) {
		// Handle Directus API errors
		errorPayload = {
			directusApiErrors: error.errors.map((e: DirectusError) => ({
				message: e.message || 'Unknown error',
				code: e.extensions?.code,
			})),
		};
	} else {
		// Handle generic errors
		let message = 'An unknown error occurred.';
		let code: string | undefined;

		if (error instanceof Error) {
			message = error.message;
			code = 'code' in error ? String(error.code) : undefined;
		} else if (typeof error === 'object' && error !== null) {
			message = 'message' in error ? String(error.message) : message;
			code = 'code' in error ? String(error.code) : undefined;
		} else if (typeof error === 'string') {
			message = error;
		}

		errorPayload = { error: message, ...(code && { code }) };
	}

	return {
		isError: true,
		content: [{ type: 'text' as const, text: JSON.stringify(errorPayload) }],
	};
};
