import api from '@/api';
import { Header } from '@/components/v-table/types';
import { useFieldsStore } from '@/stores/';
import { Field } from '@directus/shared/types';
import { addRelatedPrimaryKeyToFields } from '@/utils/add-related-primary-key-to-fields';
import { cloneDeep, get, merge, isEqual } from 'lodash';
import { Ref, ref, watch } from 'vue';
import { RelationInfo } from '@/composables/use-m2m';
import { getEndpoint } from '@/utils/get-endpoint';

type UsablePreview = {
	tableHeaders: Ref<Header[]>;
	items: Ref<Record<string, any>[]>;
	initialItems: Ref<Record<string, any>[]>;
	loading: Ref<boolean>;
	error: Ref<any>;
};

export default function usePreview(
	value: Ref<(string | number | Record<string, any>)[] | null>,
	fields: Ref<string[]>,
	relation: Ref<RelationInfo>,
	getNewSelectedItems: () => Record<string, any>[],
	getUpdatedItems: () => Record<string, any>[],
	getNewItems: () => Record<string, any>[],
	getPrimaryKeys: () => (string | number)[]
): UsablePreview {
	// Using a ref for the table headers here means that the table itself can update the
	// values if it needs to. This allows the user to manually resize the columns for example

	const fieldsStore = useFieldsStore();
	const tableHeaders = ref<Header[]>([]);
	const loading = ref(false);
	const initialItems = ref<Record<string, any>[]>([]);
	const items = ref<Record<string, any>[]>([]);
	const error = ref<any>(null);

	watch(
		() => value.value,
		async (newVal, oldVal) => {
			if (newVal === null) {
				items.value = [];
				return;
			}

			if (isEqual(newVal, oldVal)) return;

			loading.value = true;
			const { junctionField, relationPkField, relationCollection } = relation.value;
			if (junctionField === null) return;

			// Load the junction items so we have access to the id's in the related collection
			const junctionItems = await loadRelatedIds();

			const relatedPrimaryKeys = junctionItems.reduce((acc, junction) => {
				const id = get(junction, junctionField);
				if (id !== null) acc.push(id);
				return acc;
			}, []) as (string | number)[];

			const filteredFields = [...(fields.value.length > 0 ? getRelatedFields(fields.value) : getDefaultFields())];

			if (filteredFields.includes(relationPkField) === false) filteredFields.push(relationPkField);

			try {
				let responseData: Record<string, any>[] = [];

				if (relatedPrimaryKeys.length > 0) {
					responseData = await request(relationCollection, filteredFields, relationPkField, relatedPrimaryKeys);
				}

				// Insert the related items into the junction items
				responseData = responseData.map((data) => {
					const id = get(data, relationPkField);
					const junction = junctionItems.find((junction) => junction[junctionField] === id);

					if (junction === undefined || id === undefined) return;

					const newJunction = cloneDeep(junction);
					newJunction[junctionField] = data;
					return newJunction;
				}) as Record<string, any>[];

				const updatedItems = getUpdatedItems();
				const newItems = getNewItems();

				// Replace existing items with it's updated counterparts
				responseData = responseData
					.map((item) => {
						const updatedItem = updatedItems.find(
							(updated) =>
								get(updated, [junctionField, relationPkField]) === get(item, [junctionField, relationPkField])
						);
						if (updatedItem !== undefined) return merge(item, updatedItem);
						return item;
					})
					.concat(...newItems);

				if (!initialItems.value.length) initialItems.value = responseData;

				items.value = responseData;
			} catch (err: any) {
				error.value = err;
			} finally {
				loading.value = false;
			}
		},
		{ immediate: true }
	);

	// Seeing we don't care about saving those tableHeaders, we can reset it whenever the
	// fields prop changes (most likely when we're navigating to a different o2m context)
	watch(
		() => fields.value,
		() => {
			const { junctionField, junctionCollection } = relation.value;

			tableHeaders.value = (
				fields.value.length > 0 ? fields.value : getDefaultFields().map((field) => `${junctionField}.${field}`)
			)
				.map((fieldKey) => {
					const field = fieldsStore.getField(junctionCollection, fieldKey);

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

	return { tableHeaders, items, initialItems, loading, error };

	function getRelatedFields(fields: string[]) {
		const { junctionField } = relation.value;

		return fields.reduce((acc: string[], field) => {
			const sections = field.split('.');
			if (junctionField === sections[0] && sections.length >= 2) acc.push(sections.slice(1).join('.'));
			return acc;
		}, []);
	}

	function getJunctionFields() {
		return (fields.value || []).filter((field) => field.includes('.') === false);
	}

	async function loadRelatedIds() {
		const { junctionPkField, junctionField, relationPkField, junctionCollection } = relation.value;

		try {
			let data: Record<string, any>[] = [];
			const primaryKeys = getPrimaryKeys();

			if (primaryKeys.length > 0) {
				const filteredFields = getJunctionFields();

				if (filteredFields.includes(junctionPkField) === false) filteredFields.push(junctionPkField);
				if (filteredFields.includes(junctionField) === false) filteredFields.push(junctionField);

				if (relation.value.sortField !== null && filteredFields.includes(relation.value.sortField) === false)
					filteredFields.push(relation.value.sortField);

				data = await request(junctionCollection, filteredFields, junctionPkField, primaryKeys);
			}

			const updatedItems = getUpdatedItems().map((item) => ({
				[junctionField]: item[junctionField][relationPkField],
			}));

			// Add all items that already had the id of it's related item
			return data.concat(...getNewSelectedItems(), ...updatedItems);
		} catch (err: any) {
			error.value = err;
		}
		return [];
	}

	async function request(
		collection: string,
		fields: string[] | null,
		filteredField: string,
		primaryKeys: (string | number)[] | null
	) {
		if (fields === null || fields.length === 0 || primaryKeys === null || primaryKeys.length === 0) return [];

		const fieldsToFetch = addRelatedPrimaryKeyToFields(collection, fields);

		const response = await api.get(getEndpoint(collection), {
			params: {
				fields: fieldsToFetch,
				[`filter[${filteredField}][_in]`]: primaryKeys.join(','),
			},
		});
		return response?.data.data as Record<string, any>[];
	}

	function getDefaultFields(): string[] {
		const fields = fieldsStore.getFieldsForCollection(relation.value.relationCollection);
		return fields.slice(0, 3).map((field: Field) => field.field);
	}
}
