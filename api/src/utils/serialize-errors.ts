import { isDirectusError } from '@directus/errors';
import { deepMap } from '@directus/utils';

/**
 * Convert errors, including ones nested in arrays or plain objects, to plain JSON-safe objects.
 * Only a known set of properties is kept, so that sensitive data attached to errors
 * (e.g. the request config of an AxiosError) isn't passed on.
 */
export function serializeErrors(value: unknown, ancestors = new Set<Error>()): unknown {
	if (!(value instanceof Error)) {
		return deepMap(value, (item) => (item instanceof Error ? serializeErrors(item, ancestors) : item));
	}

	// Drop circular references to errors that are already being serialized
	if (ancestors.has(value)) return undefined;

	ancestors = new Set(ancestors).add(value);

	const serialized: Record<string, unknown> = { name: value.name, message: value.message };

	for (const key of ['code', 'status'] as const) {
		const property = (value as Partial<Record<typeof key, unknown>>)[key];

		if (typeof property === 'string' || typeof property === 'number') serialized[key] = property;
	}

	if (isDirectusError(value) && value.extensions !== undefined) {
		serialized['extensions'] = serializeErrors(value.extensions, ancestors);
	}

	if (value.cause instanceof Error && !ancestors.has(value.cause)) {
		serialized['cause'] = serializeErrors(value.cause, ancestors);
	}

	return serialized;
}
