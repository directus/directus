<template>
	<private-view :title="title">
		<template #headline v-if="breadcrumb">
			<v-breadcrumb :items="breadcrumb" />
		</template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="people_alt" outline />
			</v-button>
		</template>

		<template #actions:prepend>
			<portal-target name="actions:prepend" />
		</template>

		<template #actions>
			<search-input v-model="searchQuery" />

			<v-dialog v-model="confirmDelete" v-if="selection.length > 0" @esc="confirmDelete = false">
				<template #activator="{ on }">
					<v-button
						:disabled="batchDeleteAllowed !== true"
						rounded
						icon
						class="action-delete"
						@click="on"
						v-tooltip.bottom="batchDeleteAllowed ? $t('delete') : $t('not_allowed')"
					>
						<v-icon name="delete" outline />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ $tc('batch_delete_confirm', selection.length) }}</v-card-title>

					<v-card-actions>
						<v-button @click="confirmDelete = false" secondary>
							{{ $t('cancel') }}
						</v-button>
						<v-button @click="batchDelete" class="action-delete" :loading="deleting">
							{{ $t('delete') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button
				rounded
				icon
				class="action-batch"
				:disabled="batchEditAllowed === false"
				@click="batchEditActive = true"
				v-if="selection.length > 1"
				v-tooltip.bottom="batchEditAllowed ? $t('edit') : $t('not_allowed')"
			>
				<v-icon name="edit" outline />
			</v-button>

			<v-button
				v-if="canInviteUsers"
				rounded
				icon
				@click="userInviteModalActive = true"
				v-tooltip.bottom="$t('invite_users')"
				class="invite-user"
			>
				<v-icon name="person_add" />
			</v-button>

			<v-button
				rounded
				icon
				:to="addNewLink"
				v-tooltip.bottom="createAllowed ? $t('create_item') : $t('not_allowed')"
				:disabled="createAllowed === false"
			>
				<v-icon name="add" />
			</v-button>
		</template>

		<template #navigation>
			<users-navigation :current-role="queryFilters && queryFilters.role" />
		</template>

		<users-invite v-if="canInviteUsers" v-model="userInviteModalActive" @toggle="refresh" />

		<component
			class="layout"
			ref="layoutRef"
			:is="`layout-${layout}`"
			collection="directus_users"
			:selection.sync="selection"
			:layout-options.sync="layoutOptions"
			:layout-query.sync="layoutQuery"
			:filters="_filters"
			:search-query="searchQuery"
			:reset-preset="resetPreset"
			@update:filters="filters = $event"
		>
			<template #no-results>
				<v-info :title="$t('no_results')" icon="search" center>
					{{ $t('no_results_copy') }}

					<template #append>
						<v-button @click="clearFilters">{{ $t('clear_filters') }}</v-button>
					</template>
				</v-info>
			</template>

			<template #no-items>
				<v-info :title="$tc('user_count', 0)" icon="people_alt" center>
					{{ $t('no_users_copy') }}

					<template v-if="canInviteUsers" #append>
						<v-button :to="{ path: '/users/+', query: queryFilters }">{{ $t('create_user') }}</v-button>
					</template>
				</v-info>
			</template>
		</component>

		<drawer-batch
			:primary-keys="selection"
			:active.sync="batchEditActive"
			collection="directus_users"
			@refresh="refresh"
		/>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="$t('information')" close>
				<div class="page-description" v-html="marked($t('page_help_users_collection'))" />
			</sidebar-detail>
			<layout-sidebar-detail @input="layout = $event" :value="layout" />
			<portal-target name="sidebar" />
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, ref, PropType } from '@vue/composition-api';
import UsersNavigation from '../components/navigation.vue';
import UsersInvite from '@/views/private/components/users-invite';

import { i18n } from '@/lang';
import api from '@/api';
import { LayoutComponent } from '@/layouts/types';
import usePreset from '@/composables/use-preset';
import LayoutSidebarDetail from '@/views/private/components/layout-sidebar-detail';
import SearchInput from '@/views/private/components/search-input';
import { useUserStore, usePermissionsStore } from '@/stores';
import marked from 'marked';
import useNavigation from '../composables/use-navigation';
import DrawerBatch from '@/views/private/components/drawer-batch';
import { Role } from '@/types';

type Item = {
	[field: string]: any;
};

export default defineComponent({
	name: 'users-collection',
	components: { UsersNavigation, LayoutSidebarDetail, SearchInput, UsersInvite, DrawerBatch },
	props: {
		queryFilters: {
			type: Object as PropType<Record<string, string>>,
			default: null,
		},
	},
	setup(props) {
		const { roles } = useNavigation();
		const layoutRef = ref<LayoutComponent | null>(null);
		const userInviteModalActive = ref(false);
		const userStore = useUserStore();
		const permissionsStore = usePermissionsStore();

		const selection = ref<Item[]>([]);

		const { layout, layoutOptions, layoutQuery, filters, searchQuery, resetPreset } = usePreset(ref('directus_users'));
		const { addNewLink } = useLinks();

		const { confirmDelete, deleting, batchDelete, error: deleteError, batchEditActive } = useBatch();

		const { breadcrumb, title } = useBreadcrumb();

		const _filters = computed(() => {
			if (props.queryFilters !== null) {
				const urlFilters = [];

				for (const [field, value] of Object.entries(props.queryFilters)) {
					urlFilters.push({
						locked: true,
						operator: 'eq',
						field,
						value,
					});
				}

				return [...urlFilters, ...filters.value];
			}

			return filters.value;
		});

		const canInviteUsers = computed(() => {
			const isAdmin = !!userStore.state.currentUser?.role?.admin_access;

			if (isAdmin) return true;

			const usersCreatePermission = permissionsStore.state.permissions.find(
				(permission) => permission.collection === 'directus_users' && permission.action === 'create'
			);
			const rolesReadPermission = permissionsStore.state.permissions.find(
				(permission) => permission.collection === 'directus_roles' && permission.action === 'read'
			);

			return !!usersCreatePermission && !!rolesReadPermission;
		});

		const { batchEditAllowed, batchDeleteAllowed, createAllowed } = usePermissions();

		return {
			canInviteUsers,
			_filters,
			addNewLink,
			breadcrumb,
			title,
			filters,
			layoutRef,
			selection,
			layoutOptions,
			layoutQuery,
			layout,
			searchQuery,
			marked,
			clearFilters,
			userInviteModalActive,
			refresh,
			batchEditAllowed,
			batchDeleteAllowed,
			createAllowed,
			resetPreset,
			confirmDelete,
			deleting,
			batchDelete,
			deleteError,
			batchEditActive,
		};

		async function refresh() {
			await layoutRef.value?.refresh();
		}

		function useBatch() {
			const confirmDelete = ref(false);
			const deleting = ref(false);

			const batchEditActive = ref(false);

			const error = ref<any>();

			return { batchEditActive, confirmDelete, deleting, batchDelete, error };

			async function batchDelete() {
				deleting.value = true;

				const batchPrimaryKeys = selection.value;

				try {
					await api.delete('/users', {
						data: batchPrimaryKeys,
					});

					await layoutRef.value?.refresh?.();

					selection.value = [];
					confirmDelete.value = false;
				} catch (err) {
					error.value = err;
				} finally {
					deleting.value = false;
				}
			}
		}

		function useLinks() {
			const addNewLink = computed<string>(() => {
				return `/users/+`;
			});

			return { addNewLink };
		}

		function useBreadcrumb() {
			const breadcrumb = computed(() => {
				if (!props.queryFilters?.role) return null;

				return [
					{
						name: i18n.t('user_directory'),
						to: `/users`,
					},
				];
			});

			const title = computed(() => {
				if (!props.queryFilters?.role) return i18n.t('user_directory');
				return roles.value?.find((role: Role) => role.id === props.queryFilters.role)?.name;
			});

			return { breadcrumb, title };
		}

		function clearFilters() {
			filters.value = [];
			searchQuery.value = null;
		}

		function usePermissions() {
			const batchEditAllowed = computed(() => {
				const admin = userStore.state?.currentUser?.role.admin_access === true;
				if (admin) return true;

				const updatePermissions = permissionsStore.state.permissions.find(
					(permission) => permission.action === 'update' && permission.collection === 'directus_users'
				);
				return !!updatePermissions;
			});

			const batchDeleteAllowed = computed(() => {
				const admin = userStore.state?.currentUser?.role.admin_access === true;
				if (admin) return true;

				const deletePermissions = permissionsStore.state.permissions.find(
					(permission) => permission.action === 'delete' && permission.collection === 'directus_users'
				);
				return !!deletePermissions;
			});

			const createAllowed = computed(() => {
				const admin = userStore.state?.currentUser?.role.admin_access === true;
				if (admin) return true;

				const createPermissions = permissionsStore.state.permissions.find(
					(permission) => permission.action === 'create' && permission.collection === 'directus_users'
				);
				return !!createPermissions;
			});

			return { batchEditAllowed, batchDeleteAllowed, createAllowed };
		}
	},
});
</script>

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color: var(--danger-10);
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-25);
	--v-button-color-hover: var(--danger);
}

.action-batch {
	--v-button-background-color: var(--warning-10);
	--v-button-color: var(--warning);
	--v-button-background-color-hover: var(--warning-25);
	--v-button-color-hover: var(--warning);
}

.header-icon {
	--v-button-color-disabled: var(--foreground-normal);
}

.layout {
	--layout-offset-top: 64px;
}

.invite-user {
	--v-button-background-color: var(--primary-10);
	--v-button-color: var(--primary);
	--v-button-background-color-hover: var(--primary-25);
	--v-button-color-hover: var(--primary);
}
</style>
