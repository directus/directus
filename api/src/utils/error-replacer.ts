/**
 * Extract values from Error objects for use with JSON.stringify()
 */
export function errorReplacer(_key: string, value: any) {
	if (value instanceof Error) {
		return {
			name: value.name,
			message: value.message,
			stack: value.stack,
			cause: value.cause,
		};
	}

	return value;
}
