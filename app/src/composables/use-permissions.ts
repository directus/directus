import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { useCollection } from '@directus/composables';
import { Field } from '@directus/types';
import { cloneDeep } from 'lodash';
import { computed, ComputedRef, Ref } from 'vue';
import { isAllowed } from '../utils/is-allowed';

type UsablePermissions = {
	createAllowed: ComputedRef<boolean>;
	deleteAllowed: ComputedRef<boolean>;
	saveAllowed: ComputedRef<boolean>;
	archiveAllowed: ComputedRef<boolean>;
	updateAllowed: ComputedRef<boolean>;
	shareAllowed: ComputedRef<boolean>;
	fields: ComputedRef<Field[]>;
	revisionsAllowed: ComputedRef<boolean>;
};

export function usePermissions(collection: Ref<string>, item: Ref<any>, isNew: Ref<boolean>): UsablePermissions {
	const userStore = useUserStore();
	const permissionsStore = usePermissionsStore();

	const { info: collectionInfo, fields: rawFields } = useCollection(collection);

	const createAllowed = computed(() => isAllowed(collection.value, 'create', item.value));

	const deleteAllowed = computed(() => isAllowed(collection.value, 'delete', item.value));

	const updateAllowed = computed(() => isAllowed(collection.value, 'update', item.value));

	const shareAllowed = computed(() => isAllowed(collection.value, 'share', item.value));

	const saveAllowed = computed(() => {
		if (isNew.value) {
			return createAllowed.value;
		}

		return updateAllowed.value;
	});

	const archiveAllowed = computed(() => {
		if (!collectionInfo.value?.meta?.archive_field) return false;

		return isAllowed(
			collection.value,
			'update',
			{
				[collectionInfo.value.meta.archive_field]: collectionInfo.value.meta.archive_value,
			},
			true,
		);
	});

	const fields = computed(() => {
		let fields = cloneDeep(rawFields.value);

		if (userStore.currentUser?.role?.admin_access === true) return fields;

		const permissions = permissionsStore.getPermissionsForUser(collection.value, isNew.value ? 'create' : 'update');

		// remove fields without read permissions so they don't show up in the DOM
		const readableFields = permissionsStore.getPermissionsForUser(collection.value, 'read')?.fields;

		if (readableFields && readableFields.includes('*') === false) {
			fields = fields.filter((field) => readableFields.includes(field.field));
		}

		if (!permissions) return fields;

		if (permissions.fields?.includes('*') === false) {
			fields = fields.map((field: Field) => {
				if (permissions.fields?.includes(field.field) === false) {
					field.meta = {
						...(field.meta || {}),
						readonly: true,
					} as any;
				}

				return field;
			});
		}

		if (permissions.presets) {
			fields = fields.map((field: Field) => {
				if (field.field in permissions.presets!) {
					field.schema = {
						...(field.schema || {}),
						default_value: permissions.presets![field.field],
					} as any;
				}

				return field;
			});
		}

		return fields;
	});

	const revisionsAllowed = computed(() => {
		if (userStore.currentUser?.role?.admin_access === true) return true;
		return !!permissionsStore.permissions.find(
			(permission) => permission.collection === 'directus_revisions' && permission.action === 'read',
		);
	});

	return {
		createAllowed,
		deleteAllowed,
		saveAllowed,
		archiveAllowed,
		updateAllowed,
		shareAllowed,
		fields,
		revisionsAllowed,
	};
}
