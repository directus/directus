<script setup lang="ts">
import { Permission, PermissionsAction } from '@directus/types';
import { computed } from 'vue';
import PermissionsToggle from './permissions-toggle.vue';
import {
	editablePermissionActions,
	EditablePermissionsAction,
	getStoredDisabledActions,
	getStoredUserOnlyActions,
} from '@/app-permissions.js';
import VIcon from '@/components/v-icon/v-icon.vue';
import { Collection } from '@/types/collections';

const props = defineProps<{
	collection: Collection;
	disabledActions?: EditablePermissionsAction[];
	userOnlyActions?: EditablePermissionsAction[];
	permissions: Permission[];
	appMinimal?: Partial<Permission>[];
}>();

const warnings = computed(() =>
	[
		{
			note: 'hardcoded_admin_only_collection_note',
			actions: getStoredDisabledActions(props.collection.collection, props.permissions),
		},
		{
			note: 'hardcoded_user_only_collection_note',
			actions: props.userOnlyActions ? getStoredUserOnlyActions(props.collection.collection, props.permissions) : [],
		},
	].filter(({ actions }) => actions.length > 0),
);

const emit = defineEmits<{
	editItem: [action: PermissionsAction];
	removeRow: [];
	setFullAccess: [action: PermissionsAction];
	setNoAccess: [action: PermissionsAction];
	setFullAccessAll: [];
	setNoAccessAll: [];
}>();
</script>

<template>
	<tr class="permissions-row" :data-collection="collection.collection">
		<td class="collection">
			<div>
				<div class="name">
					<span v-tooltip.left="collection.name" class="text">{{ collection.collection }}</span>

					<VIcon
						v-if="warnings.length > 0"
						v-tooltip.left="
							warnings
								.map(({ note, actions }) =>
									$t(note, { actions: actions.map((action) => $t(action)).join(', '), collection: collection.name }),
								)
								.join(' ')
						"
						class="permission-warning"
						name="warning"
						small
					/>
				</div>
				<div class="shortcuts">
					<button type="button" class="all" @click="emit('setFullAccessAll')">{{ $t('all') }}</button>
					<span class="divider">/</span>
					<button type="button" class="none" @click="emit('setNoAccessAll')">{{ $t('none') }}</button>
				</div>
			</div>
		</td>

		<td v-for="action in editablePermissionActions" :key="action" class="action">
			<PermissionsToggle
				:action="action"
				:collection="collection"
				:restricted="disabledActions?.includes(action)"
				:requires-user="userOnlyActions?.includes(action)"
				:permission="permissions.find((permission) => permission.action === action)"
				:app-minimal="appMinimal && appMinimal.find((permission) => permission.action === action)"
				@edit="emit('editItem', action)"
				@set-full-access="emit('setFullAccess', action)"
				@set-no-access="emit('setNoAccess', action)"
			/>
		</td>
		<td class="remove">
			<VIcon v-tooltip="$t('remove')" name="close" clickable @click="emit('removeRow')" />
		</td>
	</tr>
</template>

<style lang="scss" scoped>
.permissions-row {
	.collection {
		white-space: nowrap;
		inline-size: 100%;
	}

	.collection > div {
		display: flex;
		position: relative;
	}

	.name {
		display: flex;
		flex: 1;
		gap: 0.375rem;
		align-items: center;
		inline-size: 0.0625rem;
		padding: 0 0.6875rem;
		font-family: var(--theme--fonts--monospace--font-family);
	}

	.text {
		min-inline-size: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.permission-warning {
		flex-shrink: 0;
		color: var(--theme--warning);
	}

	.shortcuts {
		position: absolute;
		inset-inline-end: 0;
		background: var(--theme--background);
		font-family: var(--theme--fonts--monospace--font-family);
		color: var(--theme--foreground-subdued);
		font-size: 0.6875rem;
		opacity: 0;
		transition: opacity var(--fast) var(--transition);
		padding-inline-end: 0.6875rem;
		box-shadow:
			-12px 0 10px 2px var(--theme--background),
			-12px 0 12px 2px var(--theme--background);

		.all {
			&:focus-visible,
			&:hover {
				color: var(--theme--success);
			}
		}

		.none {
			&:focus-visible,
			&:hover {
				color: var(--theme--danger);
			}
		}

		.divider {
			margin: 0 0.3125rem;
		}
	}

	&:hover .shortcuts,
	.shortcuts:focus-within {
		opacity: 1;
	}

	.action {
		block-size: 2.6875rem;
		padding-inline-start: 0.6875rem;
		text-align: center;
	}

	.action + .action {
		padding-inline-start: 0.25rem;
	}

	& + .permissions-row td {
		border-block-start: var(--theme--border-width) solid var(--theme--border-color-subdued);
	}

	.remove {
		padding: 0 0.6875rem;

		.v-icon {
			--v-icon-size: 1.125rem;
			--v-icon-color: var(--theme--foreground-subdued);
			&:hover {
				--v-icon-color: var(--theme--foreground);
			}
		}
	}
}
</style>
