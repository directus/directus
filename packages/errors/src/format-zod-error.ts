import { type $ZodError, toDotPath } from 'zod/v4/core';

/**
 * Format all issues of a Zod error into a single human readable line,
 * e.g. `Invalid input: expected string, received number at "profile.name"; Required at "tags[1]"`
 */
export const formatZodError = (error: $ZodError): string =>
	error.issues
		.map(({ message, path }) => (path.length > 0 ? `${message} at "${toDotPath(path)}"` : message))
		.join('; ');
