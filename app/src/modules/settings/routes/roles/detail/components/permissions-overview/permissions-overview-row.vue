<template>
	<div class="permissions-overview-row">
		<span class="name">
			{{ collection.name }}
		</span>

		<permissions-overview-toggle
			:collection="collection"
			:role="role"
			action="create"
			:permission="getPermission('create')"
		/>
		<permissions-overview-toggle
			:collection="collection"
			:role="role"
			action="read"
			:permission="getPermission('read')"
		/>
		<permissions-overview-toggle
			:collection="collection"
			:role="role"
			action="update"
			:permission="getPermission('update')"
		/>
		<permissions-overview-toggle
			:collection="collection"
			:role="role"
			action="delete"
			:permission="getPermission('delete')"
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
			required: true,
		},
		collection: {
			type: Object as PropType<Collection>,
			required: true,
		},
		permissions: {
			type: Array as PropType<Permission[]>,
			required: true,
		},
	},
	setup(props) {
		return { getPermission };

		function getPermission(action: string) {
			return props.permissions.find((permission) => permission.action === action);
		}
	},
});
</script>

<style lang="scss" scoped>
.permissions-overview-row {
	display: flex;
	padding: 12px;
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
