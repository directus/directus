import api from '@/api';
import { Ref, ref, watch, computed } from '@vue/composition-api';
import useProjectsStore from '@/stores/projects';
import notify from '@/utils/notify';
import i18n from '@/lang';
import useCollection from '@/compositions/use-collection';

export function useItem(collection: Ref<string>, primaryKey: Ref<string | number>) {
	const { primaryKeyField } = useCollection(collection);

	const item = ref(null);
	const error = ref(null);
	const loading = ref(false);
	const saving = ref(false);
	const deleting = ref(false);
	const edits = ref({});
	const isNew = computed(() => primaryKey.value === '+');

	if (isNew.value === false) {
		getItem();
	}

	watch(collection, refresh);
	watch(primaryKey, refresh);

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
		saveAsCopy,
	};

	async function getItem() {
		const currentProjectKey = useProjectsStore().state.currentProjectKey;
		loading.value = true;

		try {
			const response = await api.get(
				`/${currentProjectKey}/items/${collection.value}/${primaryKey.value}`
			);
			item.value = response.data.data;
		} catch (err) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}

	async function save() {
		const currentProjectKey = useProjectsStore().state.currentProjectKey;
		saving.value = true;

		try {
			let response;

			if (isNew.value === true) {
				response = await api.post(
					`/${currentProjectKey}/items/${collection.value}`,
					edits.value
				);

				notify({
					title: i18n.t('item_create_success'),
					text: i18n.t('item_in', {
						collection: collection.value,
						primaryKey: primaryKey.value,
					}),
					type: 'success',
				});
			} else {
				response = await api.patch(
					`/${currentProjectKey}/items/${collection.value}/${primaryKey.value}`,
					edits.value
				);

				notify({
					title: i18n.t('item_update_success'),
					text: i18n.t('item_in', {
						collection: collection.value,
						primaryKey: primaryKey.value,
					}),
					type: 'success',
				});
			}

			item.value = response.data.data;
			edits.value = {};
		} catch (err) {
			if (isNew.value) {
				notify({
					title: i18n.t('item_create_failed'),
					text: i18n.t('item_in', {
						collection: collection.value,
						primaryKey: primaryKey.value,
					}),
					type: 'error',
				});
			} else {
				notify({
					title: i18n.t('item_update_failed'),
					text: i18n.t('item_in', {
						collection: collection.value,
						primaryKey: primaryKey.value,
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
		const currentProjectKey = useProjectsStore().state.currentProjectKey;
		saving.value = true;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const newItem: { [field: string]: any } = {
			...(item.value || {}),
			...edits.value,
		};

		// Make sure to delete the primary key
		if (primaryKeyField.value && newItem.hasOwnProperty(primaryKeyField.value.field)) {
			delete newItem[primaryKeyField.value.field];
		}

		try {
			const response = await api.post(
				`/${currentProjectKey}/items/${collection.value}`,
				newItem
			);

			notify({
				title: i18n.t('item_create_success'),
				text: i18n.t('item_in', {
					collection: collection.value,
					primaryKey: primaryKey.value,
				}),
				type: 'success',
			});

			return primaryKeyField.value ? response.data.data[primaryKeyField.value.field] : null;
		} catch (err) {
			notify({
				title: i18n.t('item_create_failed'),
				text: i18n.t('item_in', {
					collection: collection.value,
					primaryKey: primaryKey.value,
				}),
				type: 'error',
			});

			throw err;
		} finally {
			saving.value = false;
		}
	}

	async function remove() {
		const currentProjectKey = useProjectsStore().state.currentProjectKey;
		deleting.value = true;

		try {
			await api.delete(`/${currentProjectKey}/items/${collection.value}/${primaryKey.value}`);

			item.value = null;

			notify({
				title: i18n.t('item_delete_success'),
				text: i18n.t('item_in', {
					collection: collection.value,
					primaryKey: primaryKey.value,
				}),
				type: 'success',
			});
		} catch (err) {
			notify({
				title: i18n.t('item_delete_failed'),
				text: i18n.t('item_in', {
					collection: collection.value,
					primaryKey: primaryKey.value,
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
}
