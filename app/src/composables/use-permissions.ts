import { computed, ComputedRef, Ref } from '@vue/composition-api';
import { isAllowed } from '../utils/is-allowed';
import { useCollection } from './use-collection';
import { useUserStore, usePermissionsStore } from '@/stores';
import { cloneDeep } from 'lodash';
import { Field } from '@/types';

export function usePermissions(
	collection: Ref<string>,
	item: Ref<any>,
	isNew: Ref<boolean>
): Record<string, ComputedRef> {
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
		let fields = cloneDeep(rawFields.value);

		if (userStore.state.currentUser?.role?.admin_access === true) return fields;

		const permissions = permissionsStore.getPermissionsForUser(collection.value, isNew.value ? 'create' : 'update');

		if (!permissions) return fields;

		if (permissions?.fields?.includes('*') === false) {
			fields = fields.map((field: Field) => {
				if (permissions.fields.includes(field.field) === false) {
					field.meta = {
						...(field.meta || {}),
						readonly: true,
					} as any;
				}

				return field;
			});
		}

		if (permissions?.presets) {
			fields = fields.map((field: Field) => {
				if (field.field in permissions.presets) {
					field.schema = {
						...(field.schema || {}),
						default_value: permissions.presets[field.field],
					} as any;
				}

				return field;
			});
		}

		return fields;
	});

	const revisionsAllowed = computed(() => {
		if (userStore.state.currentUser?.role?.admin_access === true) return true;
		return !!permissionsStore.state.permissions.find(
			(permission) => permission.collection === 'directus_revisions' && permission.action === 'read'
		);
	});

	return { deleteAllowed, saveAllowed, archiveAllowed, updateAllowed, fields, revisionsAllowed };
}
