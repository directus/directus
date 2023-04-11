<template>
	<div>
		<v-notice type="info">
			{{
				t('presets_for_role', {
					action: t(permission.action).toLowerCase(),
					role: role ? role.name : t('public_label'),
				})
			}}
		</v-notice>
		<v-notice v-for="field in fieldWarnings" :key="field" type="warning">
			{{
				t('presets_field_warning', {
					field,
				})
			}}
		</v-notice>
		<interface-input-code :value="presets" language="json" type="json" @input="presets = $event" />
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, computed } from 'vue';
import { useFieldsStore } from '@/stores/fields';
import { Permission, Role } from '@directus/types';
import { useSync } from '@directus/composables';

export default defineComponent({
	props: {
		permission: {
			type: Object as PropType<Permission>,
			default: null,
		},
		role: {
			type: Object as PropType<Role>,
			default: null,
		},
	},
	emits: ['update:permission'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const fieldsStore = useFieldsStore();
		const fields = fieldsStore.getFieldsForCollection(props.permission.collection);

		const internalPermission = useSync(props, 'permission', emit);

		const presets = computed({
			get() {
				return internalPermission.value.presets;
			},
			set(newPresets: Record<string, any> | null) {
				internalPermission.value = {
					...internalPermission.value,
					presets: newPresets,
				};
			},
		});

		/**
		 * Interfaces that use the useRelationMultiple composable.
		 */
		const relationalInterfaces = ['list-m2a', 'list-m2m', 'list-o2m', 'list-o2m-tree-view', 'files'];

		const fieldWarnings = computed(() => {
			const errors = [];
			if (!presets.value) {
				return errors;
			}
			for (const key of Object.keys(presets.value)) {
				const field = fields.find((f) => f.field === key);
				if (
					field &&
					relationalInterfaces.includes(field.meta.interface) &&
					Array.isArray(presets.value[key]) &&
					presets.value[key].length > 0
				) {
					// Don't allow arrays as these are interpreted as the initial item value in useRelationMultiple
					errors.push(key);
				}
			}
			return errors;
		});

		return { t, presets, fieldWarnings };
	},
});
</script>

<style lang="scss" scoped>
.v-notice {
	margin-bottom: 36px;
}
</style>
