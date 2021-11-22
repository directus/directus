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
		<interface-input-code :value="presets" language="json" type="json" @input="presets = $event" />
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, computed } from 'vue';
import { Permission, Role } from '@directus/shared/types';
import { useSync } from '@directus/shared/composables';

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

		return { t, presets };
	},
});
</script>

<style lang="scss" scoped>
.v-notice {
	margin-bottom: 36px;
}
</style>
