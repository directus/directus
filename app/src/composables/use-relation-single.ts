import api from '@/api';
import { getEndpoint } from '@directus/utils';
import { unexpectedError } from '@/utils/unexpected-error';
import { merge } from 'lodash';
import { ref, Ref, watch } from 'vue';
import { RelationM2O } from '@/composables/use-relation-m2o';

export type RelationQuerySingle = {
	fields: string[];
};

export function useRelationSingle<T extends Record<string, any>>(
	value: Ref<number | string | Record<string, any> | null>,
	previewQuery: Ref<RelationQuerySingle>,
	relation: Ref<RelationM2O | undefined>
) {
	const displayItem: Ref<T | null> = ref(null);
	const loading = ref(false);

	watch([value, previewQuery, relation], getDisplayItem, { immediate: true });

	return { update, remove, refresh, displayItem, loading };

	function update(item: Record<string, any> | string | number) {
		if (!relation.value) return;

		const pkField = relation.value.relatedPrimaryKeyField.field;

		// make sure when updating from an existing primary key, we also have it inside the changes
		if (value.value && typeof item === 'object' && pkField in item === false) {
			const existingPk: string | number = typeof value.value === 'object' ? value.value[pkField] : value.value;

			item[pkField] = existingPk;
		}

		value.value = item;
	}

	function remove() {
		value.value = null;
	}

	async function refresh() {
		await getDisplayItem();
	}

	async function getDisplayItem() {
		const val = value.value;

		if (!val) {
			displayItem.value = null;
			return;
		}

		if (!relation.value) return;

		const relatedCollection = relation.value.relatedCollection.collection;
		const pkField = relation.value.relatedPrimaryKeyField.field;

		const id = typeof val === 'object' ? val[relation.value.relatedPrimaryKeyField.field] : val;

		if (!id) {
			displayItem.value = val as T;
			return;
		}

		const fields = new Set(previewQuery.value.fields);
		fields.add(pkField);

		loading.value = true;

		try {
			const response = await api.get(getEndpoint(relatedCollection) + `/${encodeURIComponent(id)}`, {
				params: {
					fields: Array.from(fields),
				},
			});

			if (typeof val === 'object') {
				displayItem.value = merge({}, response.data.data, val);
			} else {
				displayItem.value = response.data.data;
			}
		} catch (err: any) {
			// if the item has a manually entered primary key, we can ignore the error
			if (typeof val === 'object' && err.response && err.response.status === 403) {
				displayItem.value = val as T;
			} else {
				unexpectedError(err);
			}
		} finally {
			loading.value = false;
		}
	}
}
