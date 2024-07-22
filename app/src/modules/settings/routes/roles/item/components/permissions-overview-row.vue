<script setup lang="ts">
import { Collection } from '@/types/collections';
import ValueNull from '@/views/private/components/value-null.vue';
import { Permission } from '@directus/types';
import { toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { editablePermissionActions, EditablePermissionsAction } from '../../app-permissions';
import useUpdatePermissions from '../composables/use-update-permissions';
import PermissionsOverviewToggle from './permissions-overview-toggle.vue';

const props = defineProps<{
	collection: Collection;
	disabledActions?: EditablePermissionsAction[];
	permissions: Permission[];
	refreshing: number[];
	role: string | null;
	appMinimal?: Partial<Permission>[];
}>();

const { t } = useI18n();

const { collection, role, permissions } = toRefs(props);
const { setFullAccessAll, setNoAccessAll, getPermission } = useUpdatePermissions(collection, permissions, role);

function isLoading(action: string) {
	const permission = getPermission(action);
	if (!permission?.id) return false;
	return props.refreshing.includes(permission.id);
}
</script>

<template>
	<div class="permissions-overview-row">
		<span v-tooltip.left="collection.name" class="name">{{ collection.collection }}</span>

		<span class="actions">
			<span class="all" @click="setFullAccessAll">{{ t('all') }}</span>
			<span class="divider">/</span>
			<span class="none" @click="setNoAccessAll">{{ t('none') }}</span>
		</span>

		<span class="spacer" />

		<template v-for="action in editablePermissionActions" :key="action">
			<permissions-overview-toggle
				v-if="!disabledActions?.includes(action)"
				:action="action"
				:collection="collection"
				:role="role"
				:permissions="permissions"
				:loading="isLoading(action)"
				:app-minimal="appMinimal && appMinimal.find((permission) => permission.action === action)"
			/>
			<value-null v-else />
		</template>
	</div>
</template>

<style lang="scss" scoped>
.permissions-overview-row {
	display: flex;
	align-items: center;
	height: 48px;
	padding: 0 12px;

	.name {
		font-family: var(--theme--fonts--monospace--font-family);
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.actions {
		font-family: var(--theme--fonts--monospace--font-family);
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

	&:hover .actions {
		opacity: 1;
	}

	.spacer {
		flex-grow: 1;
		width: 20px;
	}

	.null {
		display: flex;
		justify-content: center;
		width: 24px;
		color: var(--theme--foreground);
		cursor: not-allowed;
	}

	:is(.permissions-overview-toggle, .null) + :is(.permissions-overview-toggle, .null) {
		margin-left: 20px;
	}

	& + .permissions-overview-row {
		border-top: var(--theme--border-width) solid var(--theme--border-color-subdued);
	}
}
</style>
