<script setup lang="ts">
import { Permission } from '@directus/types';
import { toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import useUpdatePermissions from '../composables/use-update-permissions';
import PermissionsOverviewToggle from './permissions-overview-toggle.vue';
import { Collection } from '@/types/collections';

const props = defineProps<{
	collection: Collection;
	permissions: Permission[];
	refreshing: number[];
	role?: string;
	appMinimal?: Partial<Permission>[];
}>();

const { t } = useI18n();

const { collection, role, permissions } = toRefs(props);
const { setFullAccessAll, setNoAccessAll, getPermission } = useUpdatePermissions(collection, permissions, role);

function isLoading(action: string) {
	const permission = getPermission(action);
	if (!permission) return false;
	return props.refreshing.includes(permission.id);
}
</script>

<template>
	<div class="permissions-overview-row">
		<span class="name">
			<span v-tooltip.left="collection.name">{{ collection.collection }}</span>
			<span class="actions">
				<span class="all" @click="setFullAccessAll">{{ t('all') }}</span>
				<span class="divider">/</span>
				<span class="none" @click="setNoAccessAll">{{ t('none') }}</span>
			</span>
		</span>

		<permissions-overview-toggle
			action="create"
			:collection="collection"
			:role="role"
			:permissions="permissions"
			:loading="isLoading('create')"
			:app-minimal="appMinimal && appMinimal.find((p) => p.action === 'create')"
		/>
		<permissions-overview-toggle
			action="read"
			:collection="collection"
			:role="role"
			:permissions="permissions"
			:loading="isLoading('read')"
			:app-minimal="appMinimal && appMinimal.find((p) => p.action === 'read')"
		/>
		<permissions-overview-toggle
			action="update"
			:collection="collection"
			:role="role"
			:permissions="permissions"
			:loading="isLoading('update')"
			:app-minimal="appMinimal && appMinimal.find((p) => p.action === 'update')"
		/>
		<permissions-overview-toggle
			action="delete"
			:collection="collection"
			:role="role"
			:permissions="permissions"
			:loading="isLoading('delete')"
			:app-minimal="appMinimal && appMinimal.find((p) => p.action === 'delete')"
		/>
		<permissions-overview-toggle
			action="share"
			:collection="collection"
			:role="role"
			:permissions="permissions"
			:loading="isLoading('share')"
			:app-minimal="appMinimal && appMinimal.find((p) => p.action === 'share')"
		/>
	</div>
</template>

<style lang="scss" scoped>
.permissions-overview-row {
	display: flex;
	align-items: center;
	height: 48px;
	padding: 0 12px;
	background-color: var(--theme--form--field--input--background);

	.name {
		flex-grow: 1;
		font-family: var(--theme--font-family-monospace);

		.actions {
			margin-left: 8px;
			color: var(--theme--foreground-subdued);
			font-size: 12px;
			opacity: 0;
			transition: opacity var(--fast) var(--transition);

			span {
				cursor: pointer;

				&:hover {
					&.all {
						color: var(--theme--success);
					}

					&.none {
						color: var(--theme--danger);
					}
				}
			}

			.divider {
				margin: 0 6px;
				cursor: default;
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
