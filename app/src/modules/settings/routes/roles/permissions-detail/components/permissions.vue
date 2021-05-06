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

		<interface-input-code v-model="permissions" language="json" type="json" />

		<div v-if="appMinimal" class="app-minimal">
			<v-divider />
			<v-notice type="warning">{{ $t('the_following_are_minimum_permissions') }}</v-notice>
			<pre class="app-minimal-preview">{{ appMinimal }}</pre>
		</div>
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
		appMinimal: {
			type: Object as PropType<Partial<Permission>>,
			default: undefined,
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

.app-minimal {
	.v-divider {
		margin: 24px 0;
	}

	.v-notice {
		margin-bottom: 24px;
	}

	.app-minimal-preview {
		padding: 16px;
		font-family: var(--family-monospace);
		background-color: var(--background-subdued);
		border-radius: var(--border-radius);
	}
}
</style>
