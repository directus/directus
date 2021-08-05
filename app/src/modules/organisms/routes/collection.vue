<template>
	<private-view :title="title">
		<template v-if="breadcrumb" #headline>
			<v-breadcrumb :items="breadcrumb" />
		</template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="business" outline />
			</v-button>
		</template>

		<template #actions:prepend>
			<component :is="`layout-actions-${layout}`" />
		</template>

		<template #actions>
			<search-input v-model="searchQuery" />

			<v-dialog v-if="selection.length > 0" v-model="confirmDelete" @esc="confirmDelete = false">
				<template #activator="{ on }">
					<v-button
						v-tooltip.bottom="batchDeleteAllowed ? t('delete_label') : t('not_allowed')"
						:disabled="batchDeleteAllowed !== true"
						rounded
						icon
						class="action-delete"
						@click="on"
					>
						<v-icon name="delete" outline />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ t('batch_delete_confirm', selection.length) }}</v-card-title>

					<v-card-actions>
						<v-button secondary @click="confirmDelete = false">
							{{ t('cancel') }}
						</v-button>
						<v-button class="action-delete" :loading="deleting" @click="batchDelete">
							{{ t('delete_label') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button
				v-if="selection.length > 1"
				v-tooltip.bottom="batchEditAllowed ? t('edit') : t('not_allowed')"
				rounded
				icon
				class="action-batch"
				:disabled="batchEditAllowed === false"
				@click="batchEditActive = true"
			>
				<v-icon name="edit" outline />
			</v-button>

			<v-button
				v-tooltip.bottom="createAllowed ? t('create_item') : t('not_allowed')"
				rounded
				icon
				to="/organisms/+"
				:disabled="createAllowed === false"
			>
				<v-icon name="add" />
			</v-button>
		</template>

		<template #navigation>
			<organisms-navigation />
		</template>

		<component :is="`layout-${layout}`" class="layout">
			<template #no-results>
				<v-info :title="t('no_results')" icon="search" center>
					{{ t('no_results_copy') }}

					<template #append>
						<v-button @click="clearFilters">{{ t('clear_filters') }}</v-button>
					</template>
				</v-info>
			</template>

			<template #no-items>
				<v-info :title="t('organisms_count', 0)" icon="business" center>
					{{ t('no_organisms_copy') }}
				</v-info>
			</template>
		</component>

		<drawer-batch
			v-model:active="batchEditActive"
			:primary-keys="selection"
			collection="directus_organisms"
			@refresh="refresh"
		/>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="t('information')" close>
				<div v-md="t('page_help_organisms_collection')" class="page-description" />
			</sidebar-detail>
			<layout-sidebar-detail v-model="layout" />
			<component :is="`layout-sidebar-${layout}`" />
		</template>
	</private-view>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, ref, reactive } from 'vue';
import OrganismsNavigation from '../components/navigation.vue';

import api from '@/api';
import usePreset from '@/composables/use-preset';
import LayoutSidebarDetail from '@/views/private/components/layout-sidebar-detail';
import SearchInput from '@/views/private/components/search-input';
import { useUserStore, usePermissionsStore } from '@/stores';
import { useLayout } from '@/composables/use-layout';
import DrawerBatch from '@/views/private/components/drawer-batch';

type Item = {
	[field: string]: any;
};

export default defineComponent({
	name: 'OrganismsCollection',
	components: { OrganismsNavigation, LayoutSidebarDetail, SearchInput, DrawerBatch },
	props: {
		role: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const userInviteModalActive = ref(false);
		const userStore = useUserStore();
		const permissionsStore = usePermissionsStore();

		const selection = ref<Item[]>([]);

		const { layout, layoutOptions, layoutQuery, filters, searchQuery, resetPreset } = usePreset(
			ref('directus_organisms')
		);

		const { confirmDelete, deleting, batchDelete, error: deleteError, batchEditActive } = useBatch();

		const { breadcrumb, title } = useBreadcrumb();

		const layoutFilters = computed<any[]>({
			get() {
				if (props.role !== null) {
					const roleFilter = {
						locked: true,
						operator: 'eq',
						field: 'role',
						value: props.role,
					};

					return [roleFilter, ...filters.value];
				}

				return filters.value;
			},
			set(newFilters) {
				filters.value = newFilters;
			},
		});

		const layoutState = useLayout(
			layout,
			reactive({
				collection: 'directus_organisms',
				selection,
				layoutOptions,
				layoutQuery,
				filters: layoutFilters,
				searchQuery,
				resetPreset,
				selectMode: false,
				readonly: false,
			})
		);

		const { batchEditAllowed, batchDeleteAllowed, createAllowed } = usePermissions();

		return {
			t,
			breadcrumb,
			title,
			filters,
			selection,
			layoutOptions,
			layoutQuery,
			layout,
			searchQuery,
			clearFilters,
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
			await layoutState.value.refresh();
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
					await api.delete('/organisms', {
						data: batchPrimaryKeys,
					});

					await layoutState.value.refresh();

					selection.value = [];
					confirmDelete.value = false;
				} catch (err) {
					error.value = err;
				} finally {
					deleting.value = false;
				}
			}
		}

		function useBreadcrumb() {
			const breadcrumb = computed(() => {
				if (!props.role) return null;

				return [
					{
						name: t('organism_directory'),
						to: `/organisms`,
					},
				];
			});

			return { breadcrumb };
		}

		function clearFilters() {
			filters.value = [];
			searchQuery.value = null;
		}

		function usePermissions() {
			const batchEditAllowed = computed(() => {
				const admin = userStore?.currentUser?.role.admin_access === true;
				if (admin) return true;

				const updatePermissions = permissionsStore.permissions.find(
					(permission) => permission.action === 'update' && permission.collection === 'directus_organisms'
				);
				return !!updatePermissions;
			});

			const batchDeleteAllowed = computed(() => {
				const admin = userStore?.currentUser?.role.admin_access === true;
				if (admin) return true;

				const deletePermissions = permissionsStore.permissions.find(
					(permission) => permission.action === 'delete' && permission.collection === 'directus_organisms'
				);
				return !!deletePermissions;
			});

			const createAllowed = computed(() => {
				const admin = userStore?.currentUser?.role.admin_access === true;
				if (admin) return true;

				const createPermissions = permissionsStore.permissions.find(
					(permission) => permission.action === 'create' && permission.collection === 'directus_organisms'
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
</style>
