import { useCollection } from '@directus/composables';
import { Field, ItemPermissions } from '@directus/types';
import { cloneDeep } from 'lodash-es';
import { computed, MaybeRef, ref, Ref, unref } from 'vue';
import { Collection, IsNew } from '../../types';
import type { FormField } from '@/components/v-form/types';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';

export function getFields(
	collection: Collection,
	isNew: IsNew,
	fetchedItemPermissions: Ref<ItemPermissions>,
	isVersion: MaybeRef<boolean> = false,
) {
	const userStore = useUserStore();
	const { getPermission } = usePermissionsStore();
	const { fields: rawFields, info: collectionInfo } = useCollection(ref(collection));

	return computed(() => {
		const collectionValue = unref(collection);

		if (!collectionValue) return [];

		let fields = cloneDeep(rawFields.value);

		if (userStore.isAdmin) return fields;

		const readableFields = getPermission(collectionValue, 'read')?.fields;

		// remove fields without read permissions so they don't show up in the DOM
		if (readableFields && !readableFields.includes('*')) {
			fields = fields.filter((field) => readableFields.includes(field.field));
		}

		// Item-level rules are checked at promote time, since the version can change the values they depend on.
		// Without any create/update permission nothing is locked, so users can still draft changes for a reviewer.
		if (unref(isVersion)) {
			const versionPermission = getPermission(collectionValue, unref(isNew) ? 'create' : 'update');
			if (versionPermission && versionPermission.access !== 'none') lockFieldsOutside(fields, versionPermission.fields);
			return fields;
		}

		let permission;

		if (collectionInfo.value?.meta?.singleton) {
			permission = fetchedItemPermissions.value.update;
		} else if (unref(isNew)) {
			permission = getPermission(collectionValue, 'create');
		} else {
			const storePermission = getPermission(collectionValue, 'update');

			if (storePermission?.access !== 'partial') {
				permission = storePermission;
			} else if (fetchedItemPermissions.value.update.access) {
				permission = storePermission;
			} else {
				permission = null;
			}
		}

		if (!permission || permission.access === false || permission.access === 'none') {
			for (const field of fields) {
				lockField(field);
			}
		} else {
			lockFieldsOutside(fields, permission.fields);
		}

		const presets = permission?.presets;

		if (presets) {
			for (const field of fields) {
				if (field.field in presets) {
					field.schema = {
						...(field.schema || {}),
						default_value: presets[field.field],
					} as Field['schema'];
				}
			}
		}

		return fields;
	});
}

function lockField(field: Field) {
	(field as FormField).meta = {
		...(field.meta || {}),
		readonly: true,
		non_editable: true,
	};
}

function lockFieldsOutside(fields: Field[], allowedFields: string[] | null | undefined) {
	if (!allowedFields || allowedFields.includes('*')) return;

	for (const field of fields) {
		if (!allowedFields.includes(field.field)) lockField(field);
	}
}
