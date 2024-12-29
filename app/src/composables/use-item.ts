import api from '@/api';
import { VALIDATION_TYPES } from '@/constants';
import { i18n } from '@/lang';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { APIError } from '@/types/error';
import { getDefaultValuesFromFields } from '@/utils/get-default-values-from-fields';
import { notify } from '@/utils/notify';
import { pushGroupOptionsDown } from '@/utils/push-group-options-down';
import { translate } from '@/utils/translate-object-values';
import { unexpectedError } from '@/utils/unexpected-error';
import { validateItem } from '@/utils/validate-item';
import { useNestedValidation } from '@/composables/use-nested-validation';
import { useCollection } from '@directus/composables';
import { isSystemCollection } from '@directus/system-data';
import { Alterations, Field, Item, PrimaryKey, Query, Relation } from '@directus/types';
import { getEndpoint } from '@directus/utils';
import { AxiosResponse } from 'axios';
import { mergeWith } from 'lodash';
import { ComputedRef, MaybeRef, Ref, computed, isRef, ref, unref, watch } from 'vue';
import { UsablePermissions, usePermissions } from './use-permissions';

type UsableItem<T extends Item> = {
	edits: Ref<Item>;
	hasEdits: ComputedRef<boolean>;
	item: Ref<T | null>;
	permissions: UsablePermissions;
	error: Ref<any>;
	loading: ComputedRef<boolean>;
	saving: Ref<boolean>;
	refresh: () => void;
	save: () => Promise<T>;
	isNew: ComputedRef<boolean>;
	remove: () => Promise<void>;
	deleting: Ref<boolean>;
	archive: () => Promise<void>;
	isArchived: ComputedRef<boolean | null>;
	archiving: Ref<boolean>;
	saveAsCopy: () => Promise<PrimaryKey | null>;
	getItem: () => Promise<void>;
	validationErrors: Ref<any[]>;
};

export function useItem<T extends Item>(
	collection: Ref<string>,
	primaryKey: Ref<PrimaryKey | null>,
	query: MaybeRef<Query> = {},
): UsableItem<T> {
	const { info: collectionInfo, primaryKeyField } = useCollection(collection);
	const item: Ref<T | null> = ref(null);
	const error = ref<any>(null);
	const validationErrors = ref<any[]>([]);
	const loadingItem = ref(false);
	const saving = ref(false);
	const deleting = ref(false);
	const archiving = ref(false);
	const edits = ref<Item>({});
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

	const permissions = usePermissions(collection, primaryKey, isNew);
	const fieldsWithPermissions = permissions.itemPermissions.fields;

	const loading = computed(() => loadingItem.value || permissions.itemPermissions.loading.value);

	const itemEndpoint = computed(() => {
		if (isSingle.value) {
			return getEndpoint(collection.value);
		}

		return `${getEndpoint(collection.value)}/${encodeURIComponent(primaryKey.value as string)}`;
	});

	const defaultValues = getDefaultValuesFromFields(fieldsWithPermissions);

	watch([collection, primaryKey, ...(isRef(query) ? [query] : [])], refresh);

	refreshItem();

	const { nestedValidationErrors } = useNestedValidation();

	return {
		edits,
		hasEdits,
		item,
		permissions,
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
		loadingItem.value = true;
		error.value = null;

		try {
			const response = await api.get(itemEndpoint.value, { params: unref(query) });
			setItemValueToResponse(response);
		} catch (err) {
			error.value = err;
		} finally {
			loadingItem.value = false;
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
		if (nestedValidationErrors.value?.length) errors.push(...nestedValidationErrors.value);

		if (errors.length > 0) {
			validationErrors.value = errors;
			saving.value = false;
			throw errors;
		}

		try {
			let response;

			if (isNew.value) {
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
		} catch (error) {
			saveErrorHandler(error);
		} finally {
			saving.value = false;
		}
	}

	async function saveAsCopy() {
		saving.value = true;
		validationErrors.value = [];

		const fields = collectionInfo.value?.meta?.item_duplication_fields || ['*'];

		const itemData = await api.get(itemEndpoint.value, { params: { fields } });

		const newItem: Item = {
			...(itemData.data.data || {}),
			...edits.value,
		};

		if (primaryKeyField.value && primaryKeyField.value.field in newItem) {
			if (primaryKeyField.value.schema?.has_auto_increment || primaryKeyField.value.meta?.special?.includes('uuid')) {
				delete newItem[primaryKeyField.value.field];
			}
		}

		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();
		const relations = relationsStore.getRelationsForCollection(collection.value);

		for (const relation of relations) {
			const relatedPrimaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(relation.collection);
			if (!relatedPrimaryKeyField) continue;

			const existsJunctionRelated = relationsStore.relations.find(
				(r) => r.collection === relation.collection && r.meta?.many_field === relation.meta?.junction_field,
			);

			const oneField = relation.meta?.one_field;
			if (!oneField || !(oneField in newItem)) continue;

			const fieldsToFetch = fields
				.filter((field) => field.split('.')[0] === oneField || field === '*')
				.map((field) => (field.includes('.') ? field.split('.').slice(1).join('.') : '*'));

			if (Array.isArray(newItem[oneField])) {
				const existingItems = await findExistingRelatedItems(newItem, relation, relatedPrimaryKeyField, fieldsToFetch);

				newItem[oneField] = newItem[oneField].map((relatedItem: any) => {
					if (typeof relatedItem !== 'object' && existingItems.length > 0) {
						relatedItem = existingItems.find((existingItem) => existingItem.id === relatedItem);
					}

					delete relatedItem[relatedPrimaryKeyField.field];

					updateJunctionRelatedKey(relation, existsJunctionRelated, relatedItem);
					return relatedItem;
				});
			} else {
				const newRelatedItem: Alterations = newItem[oneField];

				let existingItems = await findExistingRelatedItems(
					item.value as Item,
					relation,
					relatedPrimaryKeyField,
					fieldsToFetch,
				);

				existingItems = existingItems.filter(
					(item) => !newRelatedItem.delete.includes(item[relatedPrimaryKeyField.field]),
				);

				for (const item of newRelatedItem.update) {
					updateJunctionRelatedKey(relation, existsJunctionRelated, item);
				}

				for (const item of existingItems) {
					updateExistingRelatedItems(newRelatedItem.update, item, relatedPrimaryKeyField, relation);
				}

				newRelatedItem.update.length = 0;

				for (const item of existingItems) {
					delete item[relatedPrimaryKeyField!.field];
					newRelatedItem.create.push(item);
				}
			}
		}

		const errors = validateItem(newItem, fieldsWithPermissions.value, isNew.value);
		if (nestedValidationErrors.value?.length) errors.push(...nestedValidationErrors.value);

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
		} catch (error) {
			saveErrorHandler(error);
		} finally {
			saving.value = false;
		}

		async function findExistingRelatedItems(
			item: Item,
			relation: Relation,
			relatedPrimaryKeyField: Field,
			fieldsToFetch: string[],
		) {
			const existingIds = item?.[relation.meta!.one_field!].filter((item: any) => typeof item !== 'object');
			let existingItems: Item[] = [];

			if (existingIds.length > 0) {
				const response = await api.get(getEndpoint(relation.collection), {
					params: {
						fields: [relatedPrimaryKeyField.field, ...fieldsToFetch],
						[`filter[${relation.field}][_eq]`]: primaryKey.value,
					},
				});

				existingItems = response.data.data;
			}

			return existingItems;
		}

		function updateExistingRelatedItems(
			updatedRelatedItems: Item[],
			item: Item,
			relatedPrimaryKeyField: Field,
			relation: Relation,
		) {
			for (const updatedItem of updatedRelatedItems) {
				if (item[relatedPrimaryKeyField.field] !== updatedItem[relatedPrimaryKeyField.field]) continue;

				for (const field of fields) {
					const [relationField, fieldName] = field.split('.');

					if (relationField !== relation.meta!.one_field!) continue;

					if (fieldName && fieldName in updatedItem) item[fieldName] = updatedItem[fieldName];
				}
			}
		}

		function updateJunctionRelatedKey(relation: Relation, existsJunctionRelated: Relation | undefined, item: Item) {
			if (relation.meta?.junction_field && existsJunctionRelated?.related_collection) {
				const junctionRelatedPrimaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(
					existsJunctionRelated.related_collection,
				);

				if (relation.meta.junction_field in item && junctionRelatedPrimaryKeyField?.schema!.is_generated) {
					delete item[relation.meta.junction_field][junctionRelatedPrimaryKeyField!.field];
				}
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
				(err: APIError) => !VALIDATION_TYPES.includes(err?.extensions?.code),
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
		validationErrors.value = [];
		loadingItem.value = false;
		saving.value = false;
		deleting.value = false;
		archiving.value = false;

		item.value = null;

		refreshItem();
		permissions.itemPermissions.refresh();
	}

	function refreshItem() {
		if (isNew.value) {
			item.value = null;
		} else {
			getItem();
		}
	}

	function setItemValueToResponse(response: AxiosResponse) {
		if (
			(isSystemCollection(collection.value) && collection.value !== 'directus_collections') ||
			(collection.value === 'directus_collections' && isSystemCollection(response.data.data.collection ?? ''))
		) {
			response.data.data = translate(response.data.data);
		}

		item.value = response.data.data;
	}
}
