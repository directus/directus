<template>
	<div>
		<v-notice type="info">
			{{
				$t('presets_for_role', {
					action: $t(permission.action).toLowerCase(),
					role: role ? role.name : $t('public'),
				})
			}}
		</v-notice>
		<interface-code :value="presets" @input="presets = $event" language="json" type="json" />
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { Permission, Role } from '@/types';
import useSync from '@/composables/use-sync';

export default defineComponent({
	emits: ['update:permission'],
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
	setup(props, { emit }) {
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

		return { presets };
	},
});
</script>

<style lang="scss" scoped>
.v-notice {
	margin-bottom: 36px;
}
</style>
