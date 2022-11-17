import { ExtensionOptionsBundleEntry, JsonValue, SplitEntrypoint } from '@directus/shared/types';
import { validateExtensionOptionsBundleEntry } from '@directus/shared/utils';

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

	if (!option.app || !option.api) {
		return false;
	}

	return true;
}

export function validateBundleEntriesOption(option: JsonValue | undefined): option is ExtensionOptionsBundleEntry[] {
	if (!validateNonPrimitive(option) || !Array.isArray(option)) {
		return false;
	}

	if (
		!option.every((entry) => {
			if (!validateNonPrimitive(entry) || Array.isArray(entry)) {
				return false;
			}

			return validateExtensionOptionsBundleEntry(entry);
		})
	) {
		return false;
	}

	return true;
}
