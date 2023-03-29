import { getSimpleHash } from '@directus/shared/utils';
import { Query } from '@directus/shared/types';
import { computed, ComputedRef, Ref } from 'vue';
import { merge } from 'lodash';

export type AliasField = {
	fieldName: string;
	fieldAlias: string;
	fullAlias: string;
};

type UsableAliasFields = {
	aliasFields: ComputedRef<Record<string, AliasField> | null>;
	aliasQuery: ComputedRef<Query['alias']>;
	getAliasField: (key: string) => {
		fieldName: string;
		fieldAlias: string;
		fullAlias: string;
	};
};

export function useAliasFields(fields: Ref<string[]>): UsableAliasFields {
	const aliasFields = computed(() => {
		if (!fields.value || fields.value.length === 0) return null;

		const fieldsToAlias = fields.value.filter((field: string) => field.includes('.'));
		if (fieldsToAlias.length === 0) return null;

		return fieldsToAlias.reduce((acc, currentField) => {
			const aliasField = getAliasField(currentField);
			return merge(acc, { [currentField]: aliasField });
		}, {} as Record<string, AliasField>);
	});

	const aliasQuery = computed(() => {
		if (!aliasFields.value) return null;
		return Object.values(aliasFields.value).reduce(
			(acc, value) => ({
				...acc,
				[value.fieldAlias]: value.fieldName,
			}),
			{} as Query['alias']
		);
	});

	return { aliasFields, aliasQuery, getAliasField };

	function getAliasField(key: string) {
		// use simple hash to get a deterministic value as alias whenever it's used
		const fieldAlias = getSimpleHash(key);

		const parts = key.split('.');
		const fieldName = parts[0];
		const fullAlias = `${fieldAlias}.${parts.slice(1).join('.')}`;

		return { fieldName, fieldAlias, fullAlias };
	}
}
