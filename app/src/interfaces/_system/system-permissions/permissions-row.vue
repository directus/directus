<script setup lang="ts">
import { Collection } from '@/types/collections';
import ValueNull from '@/views/private/components/value-null.vue';
import { Permission, PermissionsAction } from '@directus/types';
import { useI18n } from 'vue-i18n';
import { editablePermissionActions, EditablePermissionsAction } from '@/app-permissions.js';
import PermissionsToggle from './permissions-toggle.vue';

defineProps<{
	collection: Collection;
	disabledActions?: EditablePermissionsAction[];
	permissions: Permission[];
	appMinimal?: Partial<Permission>[];
}>();

const emit = defineEmits<{
	editItem: [action: PermissionsAction];
	removeRow: [];
	setFullAccess: [action: PermissionsAction];
	setNoAccess: [action: PermissionsAction];
	setFullAccessAll: [];
	setNoAccessAll: [];
}>();

const { t } = useI18n();
</script>

<template>
	<tr class="permissions-row" :data-collection="collection.collection">
		<td class="collection">
			<div>
				<span v-tooltip.left="collection.name" class="name">{{ collection.collection }}</span>
				<span class="shortcuts">
					<span class="all" @click="emit('setFullAccessAll')">{{ t('all') }}</span>
					<span class="divider">/</span>
					<span class="none" @click="emit('setNoAccessAll')">{{ t('none') }}</span>
				</span>
			</div>
		</td>

		<td v-for="action in editablePermissionActions" :key="action" class="action">
			<permissions-toggle
				v-if="!disabledActions?.includes(action)"
				:action="action"
				:collection="collection"
				:permission="permissions.find((permission) => permission.action === action)"
				:app-minimal="appMinimal && appMinimal.find((permission) => permission.action === action)"
				@edit="emit('editItem', action)"
				@set-full-access="emit('setFullAccess', action)"
				@set-no-access="emit('setNoAccess', action)"
			/>
			<value-null v-else />
		</td>
		<td class="remove">
			<v-icon v-tooltip="t('remove')" name="close" clickable @click="emit('removeRow')" />
		</td>
	</tr>
</template>

<style lang="scss" scoped>
.permissions-row {
	.collection {
		white-space: nowrap;
		width: 100%;
	}

	.collection > div {
		display: flex;
		position: relative;
	}

	.name {
		flex: 1;
		width: 1px;
		padding: 0 12px;
		font-family: var(--theme--fonts--monospace--font-family);
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.shortcuts {
		position: absolute;
		right: 0;
		background: var(--theme--background);
		font-family: var(--theme--fonts--monospace--font-family);
		color: var(--theme--foreground-subdued);
		font-size: 12px;
		opacity: 0;
		transition: opacity var(--fast) var(--transition);
		padding-right: 12px;
		box-shadow:
			-12px 0 10px 2px var(--theme--background),
			-12px 0 12px 2px var(--theme--background);

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

	&:hover .shortcuts {
		opacity: 1;
	}

	.action {
		height: 48px;
		padding-left: 12px;
		text-align: center;
	}

	.action + .action {
		padding-left: 4px;
	}

	.null {
		cursor: not-allowed;
	}

	:is(.permissions-overview-toggle, .null) + :is(.permissions-overview-toggle, .null) {
		margin-left: 20px;
	}

	& + .permissions-row td {
		border-top: var(--theme--border-width) solid var(--theme--border-color-subdued);
	}

	.remove {
		padding: 0 12px;

		.v-icon {
			--v-icon-size: 20px;
			--v-icon-color: var(--theme--foreground-subdued);
			&:hover {
				--v-icon-color: var(--theme--foreground);
			}
		}
	}
}
</style>
