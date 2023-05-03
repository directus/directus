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

<script setup lang="ts">
import { useSync } from '@directus/composables';
import { Permission, Role } from '@directus/types';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	permission: Permission;
	role?: Role;
}>();

const emit = defineEmits(['update:permission']);

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
</script>

<style lang="scss" scoped>
.v-notice {
	margin-bottom: 36px;
}
</style>
