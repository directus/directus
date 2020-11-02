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
		<interface-code v-model="presets" language="json" type="json" />
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import { Permission, Role } from '@/types';
import useSync from '@/composables/use-sync';

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
	setup(props, { emit }) {
		const _permission = useSync(props, 'permission', emit);

		const presets = computed({
			get() {
				return _permission.value.presets;
			},
			set(newPresets: Record<string, any> | null) {
				_permission.value = {
					..._permission.value,
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
