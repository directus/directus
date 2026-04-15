import { GENERATE_SPECIAL, RELATIONAL_TYPES, TRANSLATIONS_STRIPPED_ON_CLONE_SPECIALS } from '@directus/constants';
import { InvalidPayloadError } from '@directus/errors';
import type { Field, RawField } from '@directus/types';

export const DANGEROUS_SPECIALS = new Set<string>(GENERATE_SPECIAL);
export const RELATIONAL_SPECIALS = new Set<string>(RELATIONAL_TYPES);
export const STRIPPED_ON_CLONE_SPECIALS = new Set<string>(TRANSLATIONS_STRIPPED_ON_CLONE_SPECIALS);

export function validateFieldsEligibility(sourceFields: Field[]) {
	for (const sourceField of sourceFields) {
		const specials = Array.isArray(sourceField.meta?.special) ? sourceField.meta.special : [];

		if (
			sourceField.type === 'alias' ||
			sourceField.meta?.system === true ||
			sourceField.schema?.has_auto_increment === true
		) {
			throw new InvalidPayloadError({ reason: `Field "${sourceField.field}" is not eligible for translations` });
		}

		if (specials.some((special: string) => DANGEROUS_SPECIALS.has(special) || RELATIONAL_SPECIALS.has(special))) {
			throw new InvalidPayloadError({ reason: `Field "${sourceField.field}" is not eligible for translations` });
		}
	}
}

export function cloneFields(options: { fields: string[]; sourceFields: Field[] }): RawField[] {
	const { fields: fieldNames, sourceFields } = options;

	return fieldNames.map((fieldName) => {
		const sourceField = sourceFields.find((field) => field.field === fieldName);

		if (!sourceField) {
			throw new InvalidPayloadError({ reason: `Field "${fieldName}" does not exist in source fields` });
		}

		const clonedMeta = { ...(sourceField.meta ?? {}) };

		delete clonedMeta.id;
		delete clonedMeta.collection;
		delete clonedMeta.sort;
		delete clonedMeta.group;

		clonedMeta.required = false;
		clonedMeta.hidden = false;
		clonedMeta.readonly = false;

		if (Array.isArray(clonedMeta.special)) {
			clonedMeta.special = clonedMeta.special.filter((special: string) => !STRIPPED_ON_CLONE_SPECIALS.has(special));

			if (clonedMeta.special.length === 0) {
				clonedMeta.special = null;
			}
		}

		return {
			field: fieldName,
			type: sourceField.type ?? 'string',
			schema: {
				default_value: sourceField.schema?.default_value ?? null,
				max_length: sourceField.schema?.max_length ?? null,
				numeric_precision: sourceField.schema?.numeric_precision ?? null,
				numeric_scale: sourceField.schema?.numeric_scale ?? null,
				is_nullable: true,
			},
			meta: clonedMeta,
		};
	});
}
