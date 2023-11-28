import api from '@/api';
import { VALIDATION_TYPES } from '@/constants';
import { i18n } from '@/lang';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { APIError } from '@/types/error';
import { getDefaultValuesFromFields } from '@/utils/get-default-values-from-fields';
import { notify } from '@/utils/notify';
import { translate } from '@/utils/translate-object-values';
import { unexpectedError } from '@/utils/unexpected-error';
import { validateItem } from '@/utils/validate-item';
import { useCollection } from '@directus/composables';
import { Field, Query, Relation } from '@directus/types';
import { getEndpoint } from '@directus/utils';
import { AxiosResponse } from 'axios';
import { mergeWith } from 'lodash';
import { ComputedRef, Ref, computed, isRef, ref, unref, watch } from 'vue';
import { usePermissions } from './use-permissions';
import { pushGroupOptionsDown } from '@/utils/push-group-options-down';

type UsableItem<T extends Record<string, any>> = {
	edits: Ref<Record<string, any>>;
	hasEdits: Ref<boolean>;
	item: Ref<T | null>;
	error: Ref<any>;
	loading: Ref<boolean>;
	saving: Ref<boolean>;
	refresh: () => void;
	save: () => Promise<any>;
	isNew: ComputedRef<boolean>;
	remove: () => Promise<void>;
	deleting: Ref<boolean>;
	archive: () => Promise<void>;
	isArchived: ComputedRef<boolean | null>;
	archiving: Ref<boolean>;
	saveAsCopy: () => Promise<any>;
	getItem: () => Promise<void>;
	validationErrors: Ref<any[]>;
};

export function useItem<T extends Record<string, any>>(
	collection: Ref<string>,
	primaryKey: Ref<string | number | null>,
	query: Ref<Query> | Query = {},
): UsableItem<T> {
	const { info: collectionInfo, primaryKeyField } = useCollection(collection);
	const item: Ref<T | null> = ref(null);
	const error = ref<any>(null);
	const validationErrors = ref<any[]>([]);
	const loading = ref(false);
	const saving = ref(false);
	const deleting = ref(false);
	const archiving = ref(false);
	const edits = ref<Record<string, any>>({});
	const hasEdits = computed(() => Object.keys(edits.value).length > 0);
	const isNew = computed(() => primaryKey.value === '+');
	const isSingle = computed(() => !!collectionInfo.value?.meta?.singleton);

	const isArchived = computed(() => {
		if (!collectionInfo.value?.meta?.archive_field) return null;

		if (collectionInfo.value.meta.archive_value === 'true') {
			return item.value?.[collectionInfo.value.meta.archive_field] === true;
		}

		return item.value?.[collectionInfo.value.meta.archive_field] === collectionInfo.value.meta.archive_value;
	});

	const { fields: fieldsWithPermissions } = usePermissions(collection, item, isNew);

	const itemEndpoint = computed(() => {
		if (isSingle.value) {
			return getEndpoint(collection.value);
		}

		return `${getEndpoint(collection.value)}/${encodeURIComponent(primaryKey.value as string)}`;
	});

	const defaultValues = getDefaultValuesFromFields(fieldsWithPermissions);

	watch([collection, primaryKey, ...(isRef(query) ? [query] : [])], refresh, { immediate: true });

	return {
		edits,
		hasEdits,
		item,
		error,
		loading,
		saving,
		refresh,
		save,
		isNew,
		remove,
		deleting,
		archive,
		isArchived,
		archiving,
		saveAsCopy,
		getItem,
		validationErrors,
	};

	async function getItem() {
		loading.value = true;
		error.value = null;

		try {
			const response = await api.get(itemEndpoint.value, { params: unref(query) });
			setItemValueToResponse(response);
		} catch (err: any) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}

	async function save() {
		saving.value = true;
		validationErrors.value = [];

		const payloadToValidate = mergeWith(
			{},
			defaultValues.value,
			item.value,
			edits.value,
			function (_from: any, to: any) {
				if (typeof to !== 'undefined') {
					return to;
				}
			},
		);

		const fields = pushGroupOptionsDown(fieldsWithPermissions.value);

		const errors = validateItem(payloadToValidate, fields, isNew.value);

		if (errors.length > 0) {
			validationErrors.value = errors;
			saving.value = false;
			throw errors;
		}

		try {
			let response;

			if (isNew.value === true) {
				response = await api.post(getEndpoint(collection.value), edits.value);

				notify({
					title: i18n.global.t('item_create_success', 1),
				});
			} else {
				response = await api.patch(itemEndpoint.value, edits.value);

				notify({
					title: i18n.global.t('item_update_success', 1),
				});
			}

			setItemValueToResponse(response);
			edits.value = {};
			return response.data.data;
		} catch (err: any) {
			saveErrorHandler(err);
		} finally {
			saving.value = false;
		}
	}

	async function saveAsCopy() {
		saving.value = true;
		validationErrors.value = [];

		const fields = collectionInfo.value?.meta?.item_duplication_fields || ['*'];

		const itemData = await api.get(itemEndpoint.value, { params: { fields } });

		const newItem: { [field: string]: any } = {
			...(itemData.data.data || {}),
			...edits.value,
		};

		// Make sure to delete the primary key if it's has auto increment enabled
		if (primaryKeyField.value && primaryKeyField.value.field in newItem) {
			if (primaryKeyField.value.schema?.has_auto_increment || primaryKeyField.value.meta?.special?.includes('uuid')) {
				delete newItem[primaryKeyField.value.field];
			}
		}

		// Make sure to delete nested relational primary keys
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();
		const relations = relationsStore.getRelationsForCollection(collection.value);

		for (const relation of relations) {
			const relatedPrimaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(relation.collection);

			const existsJunctionRelated = relationsStore.relations.find((r) => {
				return r.collection === relation.collection && r.meta?.many_field === relation.meta?.junction_field;
			});

			if (relation.meta?.one_field && relation.meta.one_field in newItem) {
				const fieldsToFetch = fields
					.filter((field) => field.startsWith(relation.meta!.one_field!))
					.map((field) => field.split('.').slice(1).join('.'));

				if (Array.isArray(newItem[relation.meta.one_field])) {
					const existingItems = await findExistingRelatedItems(
						newItem,
						relation,
						relatedPrimaryKeyField,
						fieldsToFetch,
					);

					newItem[relation.meta.one_field] = newItem[relation.meta.one_field].map((relatedItem: any) => {
						if (typeof relatedItem !== 'object' && existingItems.length > 0) {
							relatedItem = existingItems.find((existingItem: any) => existingItem.id === relatedItem);
						}

						delete relatedItem[relatedPrimaryKeyField!.field];

						updateJunctionRelatedKey(relation, existsJunctionRelated, fieldsStore, relatedItem);
						return relatedItem;
					});
				} else {
					const createdRelatedItems = newItem[relation.meta.one_field]?.create;
					const updatedRelatedItems = newItem[relation.meta.one_field]?.update;
					const deletedRelatedItems = newItem[relation.meta.one_field]?.delete;

					let existingItems: any[] = await findExistingRelatedItems(
						item.value,
						relation,
						relatedPrimaryKeyField,
						fieldsToFetch,
					);

					existingItems = existingItems.filter((i) => {
						return deletedRelatedItems.indexOf(i[relatedPrimaryKeyField!.field]) === -1;
					});

					for (const item of updatedRelatedItems) {
						updateJunctionRelatedKey(relation, existsJunctionRelated, fieldsStore, item);
					}

					for (const item of existingItems) {
						updateExistingRelatedItems(updatedRelatedItems, item, relatedPrimaryKeyField, relation);
					}

					updatedRelatedItems.length = 0;

					for (const item of existingItems) {
						delete item[relatedPrimaryKeyField!.field];
						createdRelatedItems.push(item);
					}
				}
			}
		}

		const errors = validateItem(newItem, fieldsWithPermissions.value, isNew.value);

		if (errors.length > 0) {
			validationErrors.value = errors;
			saving.value = false;
			throw errors;
		}

		try {
			const response = await api.post(getEndpoint(collection.value), newItem);

			notify({
				title: i18n.global.t('item_create_success', 1),
			});

			// Reset edits to the current item
			edits.value = {};

			return primaryKeyField.value ? response.data.data[primaryKeyField.value.field] : null;
		} catch (err: any) {
			saveErrorHandler(err);
		} finally {
			saving.value = false;
		}

		async function findExistingRelatedItems(
			item: any,
			relation: Relation,
			relatedPrimaryKeyField: Field | null,
			fieldsToFetch: string[],
		) {
			const existingIds = item?.[relation.meta!.one_field!].filter((item: any) => typeof item !== 'object');
			let existingItems: any[] = [];

			if (existingIds.length > 0) {
				const response = await api.get(getEndpoint(relation.collection), {
					params: {
						fields: [relatedPrimaryKeyField!.field, ...fieldsToFetch],
						[`filter[${relatedPrimaryKeyField!.field}][_in]`]: existingIds.join(','),
					},
				});

				existingItems = response.data.data;
			}

			return existingItems;
		}

		function updateExistingRelatedItems(
			updatedRelatedItems: any,
			item: any,
			relatedPrimaryKeyField: Field | null,
			relation: Relation,
		) {
			for (const updatedItem of updatedRelatedItems) {
				copyUserEditValuesToExistingItem(item, relatedPrimaryKeyField, updatedItem, relation);
			}
		}

		function copyUserEditValuesToExistingItem(
			item: any,
			relatedPrimaryKeyField: Field | null,
			updatedItem: any,
			relation: Relation,
		) {
			if (item[relatedPrimaryKeyField!.field] === updatedItem[relatedPrimaryKeyField!.field]) {
				const columns = fields.filter((s) => s.startsWith(relation.meta!.one_field!));

				for (const col of columns) {
					const colName = col.split('.')[1];

					if (colName !== undefined) {
						item[colName] = updatedItem[colName];
					}
				}
			}
		}
	}

	function updateJunctionRelatedKey(
		relation: Relation,
		existsJunctionRelated: Relation | undefined,
		fieldsStore: any,
		item: any,
	) {
		if (relation.meta?.junction_field && existsJunctionRelated?.related_collection) {
			const junctionRelatedPrimaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(
				existsJunctionRelated.related_collection,
			);

			if (relation.meta.junction_field in item && junctionRelatedPrimaryKeyField.schema!.is_generated) {
				delete item[relation.meta.junction_field][junctionRelatedPrimaryKeyField!.field];
			}
		}
	}

	function saveErrorHandler(error: any) {
		if (error?.response?.data?.errors) {
			validationErrors.value = error.response.data.errors
				.filter((err: APIError) => VALIDATION_TYPES.includes(err?.extensions?.code))
				.map((err: APIError) => {
					return err.extensions;
				});

			const otherErrors = error.response.data.errors.filter(
				(err: APIError) => VALIDATION_TYPES.includes(err?.extensions?.code) === false,
			);

			if (otherErrors.length > 0) {
				otherErrors.forEach(unexpectedError);
			}
		} else {
			unexpectedError(error);
		}

		throw error;
	}

	async function archive() {
		if (!collectionInfo.value?.meta?.archive_field) return;

		archiving.value = true;

		const field = collectionInfo.value.meta.archive_field;

		let archiveValue: any = collectionInfo.value.meta.archive_value;
		if (archiveValue === 'true') archiveValue = true;
		if (archiveValue === 'false') archiveValue = false;

		let unarchiveValue: any = collectionInfo.value.meta.unarchive_value;
		if (unarchiveValue === 'true') unarchiveValue = true;
		if (unarchiveValue === 'false') unarchiveValue = false;

		try {
			let value: any = item.value && item.value[field] === archiveValue ? unarchiveValue : archiveValue;

			if (value === 'true') value = true;
			if (value === 'false') value = false;

			await api.patch(itemEndpoint.value, {
				[field]: value,
			});

			item.value = {
				...(item.value as T),
				[field]: value,
			};

			notify({
				title:
					value === archiveValue ? i18n.global.t('item_delete_success', 1) : i18n.global.t('item_update_success', 1),
			});
		} catch (error) {
			unexpectedError(error);
			throw error;
		} finally {
			archiving.value = false;
		}
	}

	async function remove() {
		deleting.value = true;

		try {
			await api.delete(itemEndpoint.value);

			item.value = null;

			notify({
				title: i18n.global.t('item_delete_success', 1),
			});
		} catch (error) {
			unexpectedError(error);
			throw error;
		} finally {
			deleting.value = false;
		}
	}

	function refresh() {
		error.value = null;
		loading.value = false;
		saving.value = false;
		deleting.value = false;

		if (isNew.value === true) {
			item.value = null;
		} else {
			getItem();
		}
	}

	function setItemValueToResponse(response: AxiosResponse) {
		if (
			(collection.value.startsWith('directus_') && collection.value !== 'directus_collections') ||
			(collection.value === 'directus_collections' && response.data.data.collection?.startsWith('directus_'))
		) {
			response.data.data = translate(response.data.data);
		}

		item.value = response.data.data;
	}
}
