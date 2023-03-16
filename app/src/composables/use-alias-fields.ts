import { getSimpleHash } from '@directus/shared/utils';
import { Query } from '@directus/shared/types';
import { computed, ComputedRef, Ref } from 'vue';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';

export type AliasFields = {
	fieldName: string;
	fieldAlias: string;
	fields: string[];
	key: string;
};

type UsableAliasFields = {
	aliasedFields: ComputedRef<Record<string, AliasFields>>;
	aliasQuery: ComputedRef<Query['alias']>;
	aliasedKeys: ComputedRef<string[]>;
};

export function useAliasFields(fields: Ref<string[]>, collection: Ref<string | null>): UsableAliasFields {
	const aliasedFields = computed(() => {
		const aliasedFields: Record<string, AliasFields> = {};

		if (!fields.value || fields.value.length === 0 || !collection.value) return aliasedFields;

		for (const field of fields.value) {
			const alias = getSimpleHash(field);
			const fullFields = adjustFieldsForDisplays([field], collection.value).map((field) => {
				if (field.includes('.')) {
					return `${alias}.${field.split('.').slice(1).join('.')}`;
				} else {
					return field;
				}
			});

			aliasedFields[alias] = {
				key: field,
				fieldName: field.split('.')[0],
				fieldAlias: alias,
				fields: fullFields,
			};
		}

		return aliasedFields;
	});

	const aliasedKeys = computed(() => {
		return Object.values(aliasedFields.value).map((field) => field.fieldAlias);
	});

	const aliasQuery = computed(() => {
		if (!aliasedFields.value) return null;
		return Object.values(aliasedFields.value).reduce(
			(acc, value) => ({
				...acc,
				[value.fieldAlias]: value.fieldName,
			}),
			{} as Query['alias']
		);
	});

	return { aliasedFields, aliasQuery, aliasedKeys };
}
