import api from '@/api';
import { useCollection } from '@directus/shared/composables';
import { useFieldsStore, useRelationsStore } from '@/stores/';
import { VALIDATION_TYPES } from '@/constants';
import { i18n } from '@/lang';
import { APIError } from '@/types';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import { AxiosResponse } from 'axios';
import { computed, ComputedRef, Ref, ref, watch } from 'vue';
import { getEndpoint } from '@directus/shared/utils';
import { translate } from '@/utils/translate-object-values';
import { usePermissions } from '../use-permissions';
import { validateItem } from '@/utils/validate-item';

type UsableItem = {
	edits: Ref<Record<string, any>>;
	hasEdits: Ref<boolean>;
	item: Ref<Record<string, any> | null>;
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
	isBatch: ComputedRef<boolean>;
	getItem: () => Promise<void>;
	validationErrors: Ref<any[]>;
};

export function useItem(collection: Ref<string>, primaryKey: Ref<string | number | null>): UsableItem {
	const { info: collectionInfo, primaryKeyField } = useCollection(collection);
	const item = ref<Record<string, any> | null>(null);
	const error = ref<any>(null);
	const validationErrors = ref<any[]>([]);
	const loading = ref(false);
	const saving = ref(false);
	const deleting = ref(false);
	const archiving = ref(false);
	const edits = ref<Record<string, any>>({});
	const hasEdits = computed(() => Object.keys(edits.value).length > 0);
	const isNew = computed(() => primaryKey.value === '+');
	const isBatch = computed(() => typeof primaryKey.value === 'string' && primaryKey.value.includes(','));
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

	watch([collection, primaryKey], refresh, { immediate: true });

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
		isBatch,
		getItem,
		validationErrors,
	};

	async function getItem() {
		loading.value = true;
		error.value = null;

		try {
			const response = await api.get(itemEndpoint.value);
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

		const errors = validateItem(edits.value, fieldsWithPermissions.value, isNew.value);

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
					title: i18n.global.t('item_create_success', isBatch.value ? 2 : 1),
				});
			} else {
				response = await api.patch(itemEndpoint.value, edits.value);

				notify({
					title: i18n.global.t('item_update_success', isBatch.value ? 2 : 1),
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

		// Make sure to delete the primary key
		if (primaryKeyField.value && primaryKeyField.value.field in newItem) {
			delete newItem[primaryKeyField.value.field];
		}

		// Make sure to delete nested relational primary keys
		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();
		const relations = relationsStore.getRelationsForCollection(collection.value);
		for (const relation of relations) {
			const relatedPrimaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(relation.collection);
			const existsJunctionRelated = relationsStore.relations.find(
				(r) => r.collection === relation.collection && r.meta?.many_field === relation.meta?.junction_field
			);

			if (relation.meta?.one_field && relation.meta.one_field in newItem) {
				const fieldsToFetch = fields
					.filter((field) => field.startsWith(relation.meta!.one_field!))
					.map((field) => field.split('.').slice(1).join('.'));

				const existingIds = newItem[relation.meta.one_field].filter((item: any) => typeof item !== 'object');

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

				newItem[relation.meta.one_field] = newItem[relation.meta.one_field].map((relatedItem: any) => {
					if (typeof relatedItem !== 'object' && existingItems.length > 0) {
						relatedItem = existingItems.find((existingItem: any) => existingItem.id === relatedItem);
					}

					delete relatedItem[relatedPrimaryKeyField!.field];

					if (relation.meta?.junction_field && existsJunctionRelated?.related_collection) {
						const junctionRelatedPrimaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(
							existsJunctionRelated.related_collection
						);
						delete relatedItem[relation.meta.junction_field][junctionRelatedPrimaryKeyField!.field];
					}
					return relatedItem;
				});
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
	}

	function saveErrorHandler(err: any) {
		if (err?.response?.data?.errors) {
			validationErrors.value = err.response.data.errors
				.filter((err: APIError) => VALIDATION_TYPES.includes(err?.extensions?.code))
				.map((err: APIError) => {
					return err.extensions;
				});

			const otherErrors = err.response.data.errors.filter(
				(err: APIError) => VALIDATION_TYPES.includes(err?.extensions?.code) === false
			);

			if (otherErrors.length > 0) {
				otherErrors.forEach(unexpectedError);
			}
		} else {
			unexpectedError(err);
		}
		throw err;
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
				...item.value,
				[field]: value,
			};

			notify({
				title:
					value === archiveValue
						? i18n.global.t('item_delete_success', isBatch.value ? 2 : 1)
						: i18n.global.t('item_update_success', isBatch.value ? 2 : 1),
			});
		} catch (err: any) {
			unexpectedError(err);
			throw err;
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
				title: i18n.global.t('item_delete_success', isBatch.value ? 2 : 1),
			});
		} catch (err: any) {
			unexpectedError(err);
			throw err;
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
		if (isBatch.value === false) {
			item.value = response.data.data;
		} else {
			const valuesThatAreEqual = { ...response.data.data[0] };

			response.data.data.forEach((existingItem: any) => {
				for (const [key, value] of Object.entries(existingItem)) {
					if (valuesThatAreEqual[key] !== value) {
						delete valuesThatAreEqual[key];
					}
				}
			});

			item.value = valuesThatAreEqual;
		}
	}
}
