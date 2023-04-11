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
import { Permission, Role } from '@directus/types';
import { useSync } from '@directus/composables';
import { useRelationsStore } from '@/stores/relations';

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

		const relationsStore = useRelationsStore();
		const relations = relationsStore.getRelationsForCollection(props.permission.collection);
		const relationFields = relations.map((relation) => relation.field);

		/**
		 * Display a warning for all relational interfaces if an array is used as the preset value.
		 *
		 * The useRelationMultiple composable treats arrays as an empty value and the preset would therefore be ignored.
		 * Presets for relational fields have to be entered with the detailed syntax.
		 */
		const fieldWarnings = computed(() => {
			const warnings: string[] = [];
			if (!presets.value) {
				return warnings;
			}
			for (const key of Object.keys(presets.value)) {
				if (relationFields.includes(key) && Array.isArray(presets.value[key]) && presets.value[key].length > 0) {
					// Don't allow arrays as these are interpreted as the initial item value in useRelationMultiple
					warnings.push(key);
				}
			}
			return warnings;
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
