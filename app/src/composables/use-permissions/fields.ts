import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { useCollection } from '@directus/composables';
import { Field } from '@directus/types';
import { cloneDeep } from 'lodash';
import { Ref, computed, unref } from 'vue';
import { Collection, IsNew } from './types';

export type UsableFieldsPermissions = {
	fields: Ref<Field[]>;
};

export function useFieldsPermissions(collection: Collection, isNew: IsNew): UsableFieldsPermissions {
	const userStore = useUserStore();
	const permissionsStore = usePermissionsStore();
	const { fields: rawFields } = useCollection(collection);

	const fields = computed(() => {
		let fields = cloneDeep(rawFields.value);

		if (userStore.isAdmin) return fields;

		const readableFields = permissionsStore.getPermissionsForUser(unref(collection), 'read')?.fields;

		// remove fields without read permissions so they don't show up in the DOM
		if (readableFields && readableFields.includes('*') === false) {
			fields = fields.filter((field) => readableFields.includes(field.field));
		}

		const permissions = permissionsStore.getPermissionsForUser(unref(collection), unref(isNew) ? 'create' : 'update');

		if (!permissions) return fields;

		if (!permissions.fields?.includes('*')) {
			for (const field of fields) {
				if (!permissions.fields?.includes(field.field)) {
					field.meta = {
						...(field.meta || {}),
						readonly: true,
					} as Field['meta'];
				}
			}
		}

		const presets = permissions.presets;

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

	return { fields };
}
