<template>
	<div>
		<v-notice type="info">
			{{
				$t('permissions_for_role', {
					action: $t(permission.action).toLowerCase(),
					role: role ? role.name : $t('public'),
				})
			}}
		</v-notice>

		<interface-code v-model="permissions" language="json" type="json" />
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
			required: true,
		},
		role: {
			type: Object as PropType<Role>,
			default: null,
		},
	},
	setup(props, { emit }) {
		const _permission = useSync(props, 'permission', emit);

		const permissions = computed({
			get() {
				return _permission.value.permissions;
			},
			set(newPermissions: Record<string, any> | null) {
				_permission.value = {
					..._permission.value,
					permissions: newPermissions,
				};
			},
		});

		return { permissions };
	},
});
</script>

<style lang="scss" scoped>
.v-notice {
	margin-bottom: 36px;
}
</style>
