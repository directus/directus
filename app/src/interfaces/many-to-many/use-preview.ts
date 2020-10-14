import { Ref, ref, watch, computed } from '@vue/composition-api';
import { Header } from '@/components/v-table/types';
import { RelationInfo } from './use-relation';
import { useFieldsStore } from '@/stores/';
import { Field, Collection } from '@/types';
import api from '@/api';
import { cloneDeep } from 'lodash';

export default function usePreview(
	value: Ref<(string | number | Record<string, any>)[] | null>,
	fields: Ref<string[]>,
	relation: Ref<RelationInfo>,
	getNewSelectedItems: () => Record<string, any>[],
	getUpdatedItems: () => Record<string, any>[],
	getNewItems: () => Record<string, any>[],
	getPrimaryKeys: () => (string | number)[]
) {
	// Using a ref for the table headers here means that the table itself can update the
	// values if it needs to. This allows the user to manually resize the columns for example

	const fieldsStore = useFieldsStore();
	const tableHeaders = ref<Header[]>([]);
	const loading = ref(false);
	const items = ref<Record<string, any>[]>([]);
	const error = ref(null);

	watch(
		() => value.value,
		async (newVal) => {
			if (newVal === null) {
				items.value = [];
				return;
			}

			loading.value = true;
			const { junctionRelation, relationPkField, junctionPkField } = relation.value;
			if (junctionRelation === null) return;

			// Load the junction items so we have access to the id's in the related collection
			const junctionItems = await loadRelatedIds();
			const relatedPrimaryKeys = junctionItems.map((junction) => junction[junctionRelation]);

			const filteredFields = [...(fields.value.length > 0 ? fields.value : getDefaultFields())];

			if (filteredFields.includes(relationPkField) === false) filteredFields.push(relationPkField);

			try {
				const endpoint = relation.value.relationCollection.startsWith('directus_')
					? `/${relation.value.relationCollection.substring(9)}`
					: `/items/${relation.value.relationCollection}`;

				const response = await api.get(endpoint, {
					params: {
						fields: filteredFields,
						[`filter[${relationPkField}][_in]`]: relatedPrimaryKeys.join(','),
					},
				});

				const responseData = (response.data.data as Record<string, any>[]) || [];

				// Insert the related items into the junction items
				const existingItems = responseData.map((data) => {
					const id = data[relationPkField];
					const junction = junctionItems.find((junction) => junction[junctionRelation] === id);
					if (junction === undefined) return;

					const newJunction = cloneDeep(junction);
					newJunction[junctionRelation] = data;
					return newJunction;
				}) as Record<string, any>[];

				const updatedItems = getUpdatedItems();
				const newItems = getNewItems();

				// Replace existing items with it's updated counterparts
				const newVal = existingItems
					.map((item) => {
						const updatedItem = updatedItems.find(
							(updated) => updated[junctionPkField] === item[junctionPkField]
						);
						if (updatedItem !== undefined) return updatedItem;
						return item;
					})
					.concat(...newItems);
				items.value = newVal;
			} catch (err) {
				error.value = err;
			} finally {
				loading.value = false;
			}
		},
		{ immediate: true }
	);

	async function loadRelatedIds() {
		const { junctionPkField, junctionRelation, relationPkField } = relation.value;

		try {
			const endpoint = relation.value.junctionCollection.startsWith('directus_')
				? `/${relation.value.junctionCollection.substring(9)}`
				: `/items/${relation.value.junctionCollection}`;

			const response = await api.get(endpoint, {
				params: {
					[`filter[${junctionPkField}][_in]`]: getPrimaryKeys().join(','),
				},
			});
			const data = response.data.data as Record<string, any>[];

			const updatedItems = getUpdatedItems().map((item) => ({
				[junctionRelation]: item[junctionRelation][relationPkField],
			}));

			// Add all items that already had the id of it's related item
			return data.concat(...getNewSelectedItems(), ...updatedItems);
		} catch (err) {
			error.value = err;
		}
		return [];
	}

	const displayItems = computed(() => {
		const { junctionRelation } = relation.value;
		return items.value.map((item) => item[junctionRelation]);
	});

	// Seeing we don't care about saving those tableHeaders, we can reset it whenever the
	// fields prop changes (most likely when we're navigating to a different o2m context)
	watch(
		() => fields.value,
		() => {
			tableHeaders.value = (fields.value.length > 0 ? fields.value : getDefaultFields())
				.map((fieldKey) => {
					const field = fieldsStore.getField(relation.value.relationCollection, fieldKey);

					if (!field) return null;

					const header: Header = {
						text: field.name,
						value: fieldKey,
						align: 'left',
						sortable: true,
						width: null,
						field: {
							display: field.meta?.display,
							displayOptions: field.meta?.display_options,
							interface: field.meta?.interface,
							interfaceOptions: field.meta?.options,
							type: field.type,
							field: field.field,
						},
					};

					return header;
				})
				.filter((h) => h) as Header[];
		},
		{ immediate: true }
	);

	function getDefaultFields(): string[] {
		const fields = fieldsStore.getFieldsForCollection(relation.value.relationCollection);
		return fields.slice(0, 3).map((field: Field) => field.field);
	}

	return { tableHeaders, displayItems, items, loading, error };
}
