import { useCollection } from '@directus/composables';
import { Field, ItemPermissions } from '@directus/types';
import { cloneDeep } from 'lodash';
import { computed, ref, Ref, unref } from 'vue';
import { Collection, IsNew } from '../../types';
import type { FormField } from '@/components/v-form/types';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';

export function getFields(collection: Collection, isNew: IsNew, fetchedItemPermissions: Ref<ItemPermissions>) {
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

		const permission = collectionInfo.value?.meta?.singleton
			? fetchedItemPermissions.value.update
			: getPermission(collectionValue, unref(isNew) ? 'create' : 'update');

		if (!permission?.fields?.includes('*')) {
			for (const field of fields) {
				if (!permission?.fields?.includes(field.field)) {
					(field as FormField).meta = {
						...(field.meta || {}),
						readonly: true,
						non_editable: true,
					};
				}
			}
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
