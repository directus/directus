import { get, getSimpleHash } from '@directus/utils';
import { Query } from '@directus/types';
import { computed, ComputedRef, Ref } from 'vue';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';

export type AliasFields = {
	fieldName: string;
	fieldAlias: string;
	fields: string[];
	key: string;
	aliased: true
} | {
	fieldName: string;
	fields: string[];
	key: string;
	aliased: false
};

type UsableAliasFields = {
	aliasedFields: ComputedRef<Record<string, AliasFields>>;
	aliasQuery: ComputedRef<Query['alias']>;
	aliasedKeys: ComputedRef<string[]>;
	getFromAliasedItem: <K, T extends Record<string, K>>(item: T, key: string) => K | undefined;
};

export function useAliasFields(fields: Ref<string[]>, collection: Ref<string | null>): UsableAliasFields {
	const aliasedFields = computed(() => {
		const aliasedFields: Record<string, AliasFields> = {};

		if (!fields.value || fields.value.length === 0 || !collection.value) return aliasedFields;

		const fieldNameCount = fields.value.reduce<Record<string, number>>((acc, field) => {
			const fieldName = field.split('.')[0];
			acc[fieldName] = (acc[fieldName] || 0) + 1;
			return acc
		}, {});

		for (const field of fields.value) {
			const fieldName = field.split('.')[0];

			if (fieldNameCount[fieldName] > 1 === false) {
				aliasedFields[field] = {
					key: field,
					fieldName,
					fields: adjustFieldsForDisplays([field], collection.value),
					aliased: false
				};
			} else {
				const alias = getSimpleHash(field);

				aliasedFields[alias] = {
					key: field,
					fieldName,
					fieldAlias: alias,
					fields: adjustFieldsForDisplays([field], collection.value).map((displayField) => {
						return `${alias}.${displayField.split('.').slice(1).join('.')}`;
					}),
					aliased: true
				};
			}
		}

		return aliasedFields;
	});

	const aliasedKeys = computed(() => {
		return Object.values(aliasedFields.value).reduce<string[]>((acc, field) => {
			if (field.aliased) {
				acc.push(field.fieldAlias);
			}
			return acc;
		}, []);
	});

	const aliasQuery = computed(() => {
		if (!aliasedFields.value) return null;
		return Object.values(aliasedFields.value).reduce<Record<string, string>>(
			(acc, value) => {
				if (value.aliased) {
					acc[value.fieldAlias] = value.fieldName;
				}
				return acc;
			},
			{}
		);
	});

	function getFromAliasedItem<K, T extends Record<string, K>>(item: T, key: string): K | undefined {

		const aliasInfo = Object.values(aliasedFields.value).find((field) => field.key === key);

		if (!aliasInfo || !aliasInfo.aliased) return get(item, key);

		if (key.includes('.') === false) return get(item, aliasInfo.fieldAlias);

		return get(item, `${aliasInfo.fieldAlias}.${key.split('.').slice(1).join('.')}`);

	}

	return { aliasedFields, aliasQuery, aliasedKeys, getFromAliasedItem };
}