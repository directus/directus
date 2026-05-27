import type { SplitEntrypoint } from '@directus/extensions';
import type { JsonValue } from '@directus/types';

function validateNonPrimitive(value: JsonValue | undefined): value is JsonValue[] | { [key: string]: JsonValue } {
	if (
		value === undefined ||
		value === null ||
		typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean'
	) {
		return false;
	}

	return true;
}

export function validateSplitEntrypointOption(option: JsonValue | undefined): option is SplitEntrypoint {
	if (!validateNonPrimitive(option) || Array.isArray(option)) {
		return false;
	}

	if (!option['app'] || !option['api']) {
		return false;
	}

	return true;
}
