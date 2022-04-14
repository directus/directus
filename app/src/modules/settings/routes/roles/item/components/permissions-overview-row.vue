<template>
	<div class="permissions-overview-row" :class="{ alias: collection.type === 'alias' }">
		<v-list-item block dense :class="{ hidden: collection.meta?.hidden }">
			<div class="item-detail">
				<v-icon
					:color="collection.meta?.hidden ? 'var(--foreground-subdued)' : collection.color ?? 'var(--primary)'"
					class="icon"
					:name="collection.meta?.hidden ? 'visibility_off' : collection.icon"
				/>
				<span ref="collectionName" class="name">
					{{ collection.name }}
					<span class="actions">
						<span class="all" @click="setFullAccessAll">{{ t('all') }}</span>
						<span class="divider">/</span>
						<span class="none" @click="setNoAccessAll">{{ t('none') }}</span>
					</span>
				</span>
				<div v-if="collection.type !== 'alias'" class="permissions-overview-toggle-row">
					<permissions-overview-toggle
						action="create"
						:collection="collection"
						:role="role"
						:permissions="filteredPermissions"
						:loading="isLoading('create')"
						:app-minimal="appMinimal && appMinimal.find((p) => p.action === 'create')"
					/>
					<permissions-overview-toggle
						action="read"
						:collection="collection"
						:role="role"
						:permissions="filteredPermissions"
						:loading="isLoading('read')"
						:app-minimal="appMinimal && appMinimal.find((p) => p.action === 'read')"
					/>
					<permissions-overview-toggle
						action="update"
						:collection="collection"
						:role="role"
						:permissions="filteredPermissions"
						:loading="isLoading('update')"
						:app-minimal="appMinimal && appMinimal.find((p) => p.action === 'update')"
					/>
					<permissions-overview-toggle
						action="delete"
						:collection="collection"
						:role="role"
						:permissions="filteredPermissions"
						:loading="isLoading('delete')"
						:app-minimal="appMinimal && appMinimal.find((p) => p.action === 'delete')"
					/>
					<permissions-overview-toggle
						action="share"
						:collection="collection"
						:role="role"
						:permissions="filteredPermissions"
						:loading="isLoading('share')"
						:app-minimal="appMinimal && appMinimal.find((p) => p.action === 'share')"
					/>
				</div>
			</div>
		</v-list-item>
	</div>

	<div class="nested-container">
		<permissions-overview-row
			v-for="collection in nestedCollections"
			:key="collection.collection"
			:collection="collection"
			:collections="collections"
			:role="role"
			:permissions="permissions"
			:refreshing="refreshing"
		/>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, toRefs, computed } from 'vue';
import { Permission, Collection } from '@directus/shared/types';
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
		collections: {
			type: Array as PropType<Collection[]>,
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
		appMinimal: {
			type: [Boolean, Array] as PropType<false | Partial<Permission>[]>,
			default: false,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const { collection, role, permissions } = toRefs(props);
		const { setFullAccessAll, setNoAccessAll, getPermission } = useUpdatePermissions(collection, permissions, role);

		const nestedCollections = computed(() =>
			props.collections.filter((collection) => collection.meta?.group === props.collection.collection)
		);

		const filteredPermissions = computed(() =>
			permissions.value.filter((p) => p.collection === collection.value.collection)
		);

		return { t, getPermission, isLoading, setFullAccessAll, setNoAccessAll, nestedCollections, filteredPermissions };

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
	margin-bottom: 8px;

	.name {
		flex-grow: 1;

		.actions {
			margin-left: 8px;
			color: var(--foreground-subdued);
			font-size: 12px;
			opacity: 0;
			transition: opacity var(--fast) var(--transition);

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

			.divider {
				margin: 0 6px;
				cursor: default;
			}
		}
	}

	.hidden .name {
		color: var(--foreground-subdued);
	}

	&:hover .name .actions {
		opacity: 1;
	}

	.item-detail {
		display: flex;
		flex-grow: 1;
		align-items: center;
		height: 100%;
		overflow: hidden;
		font-family: var(--family-monospace);

		.icon {
			margin-right: 8px;
		}

		.note {
			margin-left: 16px;
			overflow: hidden;
			color: var(--foreground-subdued);
			white-space: nowrap;
			text-overflow: ellipsis;
			opacity: 0;
			transition: opacity var(--fast) var(--transition);
		}

		.permissions-overview-toggle-row {
			display: flex;

			.permissions-overview-toggle + .permissions-overview-toggle {
				margin-left: 20px;
			}
		}
	}

	.v-list-item {
		height: auto !important;
		padding-top: 8px !important;
		padding-bottom: 8px !important;
	}
}

@media (max-width: 600px) {
	.permissions-overview-row.alias {
		display: none;
	}
}

.nested-container {
	margin-top: 8px;

	@media (min-width: 600px) {
		margin-left: 20px;
	}
}
</style>
