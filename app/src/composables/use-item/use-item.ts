import api from '@/api';
import { Ref, ref, watch, computed } from '@vue/composition-api';
import notify from '@/utils/notify';
import i18n from '@/lang';
import useCollection from '@/composables/use-collection';
import { AxiosResponse } from 'axios';

export function useItem(collection: Ref<string>, primaryKey: Ref<string | number | null>) {
	const { info: collectionInfo, primaryKeyField, softDeleteStatus, statusField } = useCollection(collection);

	const item = ref<any>(null);
	const error = ref(null);
	const loading = ref(false);
	const saving = ref(false);
	const deleting = ref(false);
	const softDeleting = ref(false);
	const edits = ref({});
	const isNew = computed(() => primaryKey.value === '+');
	const isBatch = computed(() => typeof primaryKey.value === 'string' && primaryKey.value.includes(','));
	const isSingle = computed(() => !!collectionInfo.value?.meta?.single);

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
		softDeleting,
		saveAsCopy,
		isBatch,
		getItem,
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

		try {
			let response;

			if (isNew.value === true) {
				response = await api.post(endpoint.value, edits.value);

				notify({
					title: i18n.tc('item_create_success', isBatch.value ? 2 : 1),
					text: i18n.tc('item_in', isBatch.value ? 2 : 1, {
						collection: collection.value,
						primaryKey: isBatch.value
							? (primaryKey.value as string).split(',').join(', ')
							: primaryKey.value,
					}),
					type: 'success',
				});
			} else {
				response = await api.patch(itemEndpoint.value, edits.value);

				notify({
					title: i18n.tc('item_update_success', isBatch.value ? 2 : 1),
					text: i18n.tc('item_in', isBatch.value ? 2 : 1, {
						collection: collection.value,
						primaryKey: isBatch.value
							? (primaryKey.value as string).split(',').join(', ')
							: primaryKey.value,
					}),
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
					text: i18n.tc('item_in', isBatch.value ? 2 : 1, {
						collection: collection.value,
						primaryKey: isBatch.value
							? (primaryKey.value as string).split(',').join(', ')
							: primaryKey.value,
					}),
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

			throw err;
		} finally {
			saving.value = false;
		}
	}

	async function saveAsCopy() {
		saving.value = true;

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
				text: i18n.tc('item_in', isBatch.value ? 2 : 1, {
					collection: collection.value,
					primaryKey: isBatch.value ? (primaryKey.value as string).split(',').join(', ') : primaryKey.value,
				}),
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

			throw err;
		} finally {
			saving.value = false;
		}
	}

	async function remove(soft = false) {
		if (soft) {
			softDeleting.value = true;
		} else {
			deleting.value = true;
		}

		try {
			if (soft) {
				if (!statusField.value || softDeleteStatus.value === null) {
					throw new Error('[useItem] You cant soft-delete without a status field');
				}

				await api.patch(itemEndpoint.value, {
					[statusField.value.field]: softDeleteStatus.value,
				});
			} else {
				await api.delete(itemEndpoint.value);
			}

			item.value = null;

			notify({
				title: i18n.tc('item_delete_success', isBatch.value ? 2 : 1),
				text: i18n.tc('item_in', isBatch.value ? 2 : 1, {
					collection: collection.value,
					primaryKey: isBatch.value ? (primaryKey.value as string).split(',').join(', ') : primaryKey.value,
				}),
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
			if (soft) {
				softDeleting.value = false;
			} else {
				deleting.value = false;
			}
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
