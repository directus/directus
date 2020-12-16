import { computed, Ref } from '@vue/composition-api';
import { isAllowed } from '../utils/is-allowed';
import { useCollection } from './use-collection';
import { useUserStore, usePermissionsStore } from '@/stores';
import { cloneDeep } from 'lodash';
import { Field } from '@/types';

export function usePermissions(collection: Ref<string>, item: Ref<any>, isNew: Ref<boolean>) {
	const userStore = useUserStore();
	const permissionsStore = usePermissionsStore();

	const { info: collectionInfo, fields: rawFields } = useCollection(collection);

	const deleteAllowed = computed(() => isAllowed(collection.value, 'delete', item.value));

	const saveAllowed = computed(() => {
		if (isNew.value) {
			return true;
		}

		return isAllowed(collection.value, 'update', item.value);
	});

	const updateAllowed = computed(() => isAllowed(collection.value, 'update', item.value));

	const archiveAllowed = computed(() => {
		if (!collectionInfo.value?.meta?.archive_field) return false;

		return isAllowed(
			collection.value,
			'update',
			{
				[collectionInfo.value.meta.archive_field]: collectionInfo.value.meta.archive_value,
			},
			true
		);
	});

	const fields = computed(() => {
		if (userStore.state.currentUser?.role?.admin_access === true) return rawFields.value;

		const permissions = permissionsStore.getPermissionsForUser(collection.value, isNew.value ? 'create' : 'update');

		if (!permissions) return rawFields.value;

		if (permissions?.fields?.includes('*') === true) return rawFields.value;

		return rawFields.value.map((field: Field) => {
			field = cloneDeep(field);

			if (permissions.fields.includes(field.field) === false) {
				field.meta = {
					...(field.meta || {}),
					readonly: true,
				} as any;
			}

			if (permissions.presets && field.field in permissions.presets) {
				field.schema = {
					...(field.schema || {}),
					default_value: permissions.presets[field.field],
				} as any;
			}

			return field;
		});
	});

	return { deleteAllowed, saveAllowed, archiveAllowed, updateAllowed, fields };
}
