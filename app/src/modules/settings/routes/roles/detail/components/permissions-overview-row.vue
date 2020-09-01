<template>
	<div class="permissions-overview-row">
		<span class="name">
			{{ collection.name }}
		</span>

		<permissions-overview-toggle
			action="create"
			:collection="collection"
			:role="role"
			:permission="getPermission('create')"
			:loading="isLoading('create')"
		/>
		<permissions-overview-toggle
			action="read"
			:collection="collection"
			:role="role"
			:permission="getPermission('read')"
			:loading="isLoading('read')"
		/>
		<permissions-overview-toggle
			action="update"
			:collection="collection"
			:role="role"
			:permission="getPermission('update')"
			:loading="isLoading('update')"
		/>
		<permissions-overview-toggle
			action="delete"
			:collection="collection"
			:role="role"
			:permission="getPermission('delete')"
			:loading="isLoading('delete')"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { Collection, Permission } from '@/types';
import PermissionsOverviewToggle from './permissions-overview-toggle.vue';

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
		return { getPermission, isLoading };

		function getPermission(action: string) {
			return props.permissions.find((permission) => permission.action === action);
		}

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
	}

	.permissions-overview-toggle + .permissions-overview-toggle {
		margin-left: 20px;
	}

	& + .permissions-overview-row {
		border-top: var(--border-width) solid var(--border-subdued);
	}
}
</style>
