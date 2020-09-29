import api from '@/api';
import { Ref, ref, watch, computed } from '@vue/composition-api';
import notify from '@/utils/notify';
import i18n from '@/lang';
import useCollection from '@/composables/use-collection';
import { AxiosResponse } from 'axios';
import { APIError } from '@/types';

export function useItem(collection: Ref<string>, primaryKey: Ref<string | number | null>) {
	const { info: collectionInfo, primaryKeyField } = useCollection(collection);

	const item = ref<any>(null);
	const error = ref(null);
	const validationErrors = ref([]);
	const loading = ref(false);
	const saving = ref(false);
	const deleting = ref(false);
	const archiving = ref(false);
	const edits = ref({});
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

	const endpoint = computed(() => {
		return collection.value.startsWith('directus_')
			? `/${collection.value.substring(9)}`
			: `/items/${collection.value}`;
	});

	const itemEndpoint = computed(() => {
		if (isSingle.value) {
			return endpoint.value;
		}

		return `${endpoint.value}/${primaryKey.value}`;
	});

	watch([collection, primaryKey], refresh, { immediate: true });

	return {
		edits,
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
		} catch (err) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}

	async function save() {
		saving.value = true;
		validationErrors.value = [];

		try {
			let response;

			if (isNew.value === true) {
				response = await api.post(endpoint.value, edits.value);

				notify({
					title: i18n.tc('item_create_success', isBatch.value ? 2 : 1),
					type: 'success',
				});
			} else {
				response = await api.patch(itemEndpoint.value, edits.value);

				notify({
					title: i18n.tc('item_update_success', isBatch.value ? 2 : 1),
					type: 'success',
				});
			}

			setItemValueToResponse(response);
			edits.value = {};
			return response.data.data;
		} catch (err) {
			if (isNew.value) {
				notify({
					title: i18n.tc('item_create_failed', isBatch.value ? 2 : 1),
					type: 'error',
				});
			} else {
				notify({
					title: i18n.tc('item_update_failed', isBatch.value ? 2 : 1),
					text: i18n.tc('item_in', isBatch.value ? 2 : 1, {
						collection: collection.value,
						primaryKey: isBatch.value
							? (primaryKey.value as string).split(',').join(', ')
							: primaryKey.value,
					}),
					type: 'error',
				});
			}

			if (err?.response?.data?.errors) {
				validationErrors.value = err.response.data.errors
					.filter((err: APIError) => err.extensions.code === 'FAILED_VALIDATION')
					.map((err: APIError) => {
						return err.extensions;
					});
			}

			throw err;
		} finally {
			saving.value = false;
		}
	}

	async function saveAsCopy() {
		saving.value = true;
		validationErrors.value = [];

		const newItem: { [field: string]: any } = {
			...(item.value || {}),
			...edits.value,
		};

		// Make sure to delete the primary key
		if (primaryKeyField.value && newItem.hasOwnProperty(primaryKeyField.value.field)) {
			delete newItem[primaryKeyField.value.field];
		}

		try {
			const response = await api.post(endpoint.value, newItem);

			notify({
				title: i18n.t('item_create_success'),
				type: 'success',
			});

			return primaryKeyField.value ? response.data.data[primaryKeyField.value.field] : null;
		} catch (err) {
			notify({
				title: i18n.t('item_create_failed'),
				text: i18n.tc('item_in', isBatch.value ? 2 : 1, {
					collection: collection.value,
					primaryKey: isBatch.value ? (primaryKey.value as string).split(',').join(', ') : primaryKey.value,
				}),
				type: 'error',
			});

			if (err?.response?.data?.errors) {
				validationErrors.value = err.response.data.errors
					.filter((err: APIError) => err.extensions.code === 'FAILED_VALIDATION')
					.map((err: APIError) => {
						return err.extensions;
					});
			} else {
				throw err;
			}
		} finally {
			saving.value = false;
		}
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
			let value: any = item.value[field] === archiveValue ? unarchiveValue : archiveValue;

			if (value === 'true') value = true;
			if (value === 'false') value = false;

			item.value = {
				...item.value,
				[field]: value,
			};

			await api.patch(itemEndpoint.value, {
				[field]: value,
			});

			notify({
				title: i18n.tc('item_delete_success', isBatch.value ? 2 : 1),
				type: 'success',
			});
		} catch (err) {
			notify({
				title: i18n.tc('item_delete_failed', isBatch.value ? 2 : 1),
				text: i18n.tc('item_in', isBatch.value ? 2 : 1, {
					collection: collection.value,
					primaryKey: isBatch.value ? (primaryKey.value as string).split(',').join(', ') : primaryKey.value,
				}),
				type: 'error',
			});

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
				title: i18n.tc('item_delete_success', isBatch.value ? 2 : 1),
				type: 'success',
			});
		} catch (err) {
			notify({
				title: i18n.tc('item_delete_failed', isBatch.value ? 2 : 1),
				text: i18n.tc('item_in', isBatch.value ? 2 : 1, {
					collection: collection.value,
					primaryKey: isBatch.value ? (primaryKey.value as string).split(',').join(', ') : primaryKey.value,
				}),
				type: 'error',
			});

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
