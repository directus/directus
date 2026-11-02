import { isDirectusError } from '@directus/errors';
import { deepMap } from '@directus/utils';

/**
 * Convert errors, including ones nested in arrays or plain objects, to plain JSON-safe objects.
 * Only a known set of properties is kept, so that sensitive data attached to errors
 * (e.g. the request config of an AxiosError) isn't passed on.
 */
export function serializeErrors(value: unknown): unknown {
	if (value instanceof Error) return serializeError(value);

	return deepMap(value, (item) => (item instanceof Error ? serializeError(item) : item));
}

function serializeError(error: Error, seen = new Set<Error>()): Record<string, unknown> {
	seen.add(error);

	const serialized: Record<string, unknown> = { name: error.name, message: error.message };

	for (const key of ['code', 'status'] as const) {
		const property = (error as Partial<Record<typeof key, unknown>>)[key];

		if (typeof property === 'string' || typeof property === 'number') serialized[key] = property;
	}

	if (isDirectusError(error) && error.extensions !== undefined) {
		serialized['extensions'] = error.extensions;
	}

	if (error.cause instanceof Error && !seen.has(error.cause)) {
		serialized['cause'] = serializeError(error.cause, seen);
	}

	return serialized;
}
