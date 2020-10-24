<template>
	<div class="permissions-overview-row">
		<span class="name">
			{{ collection.name }}
			<span class="actions">
				<span class="all" @click="setFullAccessAll">{{ $t('allow_all') }}</span>
				|
				<span class="none" @click="setNoAccessAll">{{ $t('allow_none') }}</span>
			</span>
		</span>

		<permissions-overview-toggle
			action="create"
			:collection="collection"
			:role="role"
			:permissions="permissions"
			:loading="isLoading('create')"
		/>
		<permissions-overview-toggle
			action="read"
			:collection="collection"
			:role="role"
			:permissions="permissions"
			:loading="isLoading('read')"
		/>
		<permissions-overview-toggle
			action="update"
			:collection="collection"
			:role="role"
			:permissions="permissions"
			:loading="isLoading('update')"
		/>
		<permissions-overview-toggle
			action="delete"
			:collection="collection"
			:role="role"
			:permissions="permissions"
			:loading="isLoading('delete')"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, inject, toRefs } from '@vue/composition-api';
import api from '@/api';
import { Collection, Permission } from '@/types';
import PermissionsOverviewToggle from './permissions-overview-toggle.vue';
import useUpdatePermissions from '../composables/use-update-permissions';

export default defineComponent({
	components: { PermissionsOverviewToggle },
	props: {
		role: {
			type: String,
			default: null,
		},
		collection: {
			type: Object as PropType<Collection>,
			required: true,
		},
		permissions: {
			type: Array as PropType<Permission[]>,
			required: true,
		},
		refreshing: {
			type: Array as PropType<number[]>,
			required: true,
		},
	},
	setup(props) {
		const { collection, role, permissions } = toRefs(props);
		const { setFullAccessAll, setNoAccessAll, getPermission } = useUpdatePermissions(collection, permissions, role);

		return { getPermission, isLoading, setFullAccessAll, setNoAccessAll };

		function isLoading(action: string) {
			const permission = getPermission(action);
			if (!permission) return false;
			return props.refreshing.includes(permission.id);
		}
	},
});
</script>

<style lang="scss" scoped>
.permissions-overview-row {
	display: flex;
	align-items: center;
	height: 48px;
	padding: 0 12px;
	background-color: var(--background-page);

	.name {
		flex-grow: 1;

		.actions {
			margin-left: 20px;
			color: var(--foreground-subdued);
			font-size: 12px;
			opacity: 0;

			span {
				cursor: pointer;

				&:hover {
					&.all {
						color: var(--success);
					}
					&.none {
						color: var(--danger);
					}
				}
			}
		}
	}

	&:hover .name .actions {
		opacity: 1;
	}

	.permissions-overview-toggle + .permissions-overview-toggle {
		margin-left: 20px;
	}

	& + .permissions-overview-row {
		border-top: var(--border-width) solid var(--border-subdued);
	}
}
</style>
