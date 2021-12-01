import api from '@/api';
import { Header } from '@/components/v-table/types';
import { useFieldsStore } from '@/stores/';
import { Field } from '@directus/shared/types';
import { addRelatedPrimaryKeyToFields } from '@/utils/add-related-primary-key-to-fields';
import { cloneDeep, get, isEqual, merge } from 'lodash';
import { ComputedRef, Ref, ref, watch } from 'vue';
import { RelationInfo } from '@/composables/use-relation-info';
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
	relationInfo: ComputedRef<RelationInfo>,
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
			if (isEqual(newVal, oldVal)) return;

			if (newVal === null) {
				items.value = [];
				return;
			}

			debugger;

			loading.value = true;
			const { relation, relatedField } = relationInfo.value;

			if (!relation || !relatedField) return;

			// Load the junction items so we have access to the id's in the related collection
			const junctionItems = await loadRelatedIds();

			const relatedPrimaryKeys = junctionItems.reduce((acc, junction) => {
				const id = get(junction, relatedField);
				if (id !== null) acc.push(id);
				return acc;
			}, []) as (string | number)[];

			const filteredFields = [...(fields.value.length > 0 ? getRelatedFields(fields.value) : getDefaultFields())];

			if (filteredFields.includes(relation.primaryKey.field) === false) filteredFields.push(relation.primaryKey.field);

			try {
				let responseData: Record<string, any>[] = [];

				if (relatedPrimaryKeys.length > 0) {
					responseData = await request(
						relation.collection,
						filteredFields,
						relation.primaryKey.field,
						relatedPrimaryKeys
					);
				}

				// Insert the related items into the junction items
				responseData = responseData.map((data) => {
					const id = get(data, relation.primaryKey.field);
					const junction = junctionItems.find((junction) => junction[relatedField] === id);

					if (junction === undefined || id === undefined) return;

					const newJunction = cloneDeep(junction);
					newJunction[relatedField] = data;
					return newJunction;
				}) as Record<string, any>[];

				const updatedItems = getUpdatedItems();
				const newItems = getNewItems();

				// Replace existing items with it's updated counterparts
				responseData = responseData
					.map((item) => {
						const updatedItem = updatedItems.find(
							(updated) =>
								// use differentdefault value to prevent match undefined or null
								get(updated, [relatedField, relation.primaryKey.field], 0) ===
								get(item, [relatedField, relation.primaryKey.field], 1)
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
			const { relatedField, relation } = relationInfo.value;

			if (!relation) return;

			tableHeaders.value = (
				fields.value.length > 0 ? fields.value : getDefaultFields().map((field) => `${relatedField}.${field}`)
			)
				.map((fieldKey) => {
					const field = fieldsStore.getField(relation.collection, fieldKey);

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
		const { relatedField } = relationInfo.value;

		return fields.reduce((acc: string[], field) => {
			const sections = field.split('.');
			if (relatedField === sections[0] && sections.length >= 2) acc.push(sections.slice(1).join('.'));
			return acc;
		}, []);
	}

	function getJunctionFields() {
		return (fields.value || []).filter((field) => field.includes('.') === false);
	}

	async function loadRelatedIds() {
		const { relation, junction, relatedField, sortField } = relationInfo.value;

		if (!junction || !relation) return [];

		try {
			let data: Record<string, any>[] = [];
			const primaryKeys = getPrimaryKeys();

			if (primaryKeys.length > 0) {
				const filteredFields = getJunctionFields();

				if (filteredFields.includes(junction.primaryKey.field) === false)
					filteredFields.push(junction.primaryKey.field);
				if (filteredFields.includes(relatedField) === false) filteredFields.push(relatedField);

				if (sortField !== null && filteredFields.includes(sortField) === false) filteredFields.push(sortField);

				data = await request(junction.collection, filteredFields, junction.primaryKey.field, primaryKeys);
			}

			const updatedItems = getUpdatedItems().map((item) => ({
				[relatedField]: item[relatedField][relation.primaryKey.field],
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
		const { relation } = relationInfo.value;
		if (!relation) return [];

		const fields = fieldsStore.getFieldsForCollection(relation.collection);
		return fields.slice(0, 3).map((field: Field) => field.field);
	}
}
