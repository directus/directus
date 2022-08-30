import { DeepPartial, Field } from '@directus/shared/types';

export function getOptions(options: any, bindings: Record<string, any>): Record<string, Partial<Field>> {
	if (!options) return {};

	let reference = options;

	if (typeof options === 'function') {
		reference = options({ options: bindings });
	}

	if (!Array.isArray(reference)) {
		reference = reference.advanced;
	}
	return (reference as Partial<Field>[]).reduce<Record<string, Partial<Field>>>((acc, field) => {
		if (field.field) acc[field.field] = field;
		return acc;
	}, {});
}
