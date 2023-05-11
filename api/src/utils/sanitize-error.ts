export function sanitizeError<T extends Error>(error: T): T {
	// clear the stack
	if (error.stack !== undefined) {
		delete error.stack;
	}

	return error;
}
