<template>
	<private-view :title="title">
		<template #headline v-if="breadcrumb">
			<v-breadcrumb :items="breadcrumb" />
		</template>

		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="people" />
			</v-button>
		</template>

		<template #actions:prepend>
			<portal-target name="actions:prepend" />
		</template>

		<template #actions>
			<search-input v-model="searchQuery" />

			<v-dialog v-model="confirmDelete" v-if="selection.length > 0">
				<template #activator="{ on }">
					<v-button rounded icon class="action-delete" @click="on">
						<v-icon name="delete" />
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
				v-if="selection.length > 1"
				:to="batchLink"
				v-tooltip.bottom="$t('edit')"
			>
				<v-icon name="edit" />
			</v-button>

			<v-button rounded icon :to="addNewLink" v-tooltip.bottom="$t('create_user')">
				<v-icon name="add" />
			</v-button>
		</template>

		<template #navigation>
			<users-navigation :current-role="queryFilters && queryFilters.role" />
		</template>

		<component
			class="layout"
			ref="layout"
			:is="`layout-${viewType}`"
			collection="directus_users"
			:selection.sync="selection"
			:view-options.sync="viewOptions"
			:view-query.sync="viewQuery"
			:filters="_filters"
			:search-query="searchQuery"
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
				<v-info :title="$tc('user_count', 0)" icon="people" center>
					{{ $t('no_users_copy') }}

					<template #append>
						<v-button :to="{ path: '/users/+', query: queryFilters }">{{ $t('create_user') }}</v-button>
					</template>
				</v-info>
			</template>
		</component>

		<template #drawer>
			<drawer-detail icon="info_outline" :title="$t('information')" close>
				<div class="format-markdown" v-html="marked($t('page_help_users_browse'))" />
			</drawer-detail>
			<layout-drawer-detail @input="viewType = $event" :value="viewType" />
			<portal-target name="drawer" />
			<drawer-detail icon="help_outline" :title="$t('help_and_docs')">
				<div class="format-markdown" v-html="marked($t('page_help_users_browse'))" />
			</drawer-detail>
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, ref, PropType } from '@vue/composition-api';
import UsersNavigation from '../../components/navigation/';

import { i18n } from '@/lang';
import api from '@/api';
import { LayoutComponent } from '@/layouts/types';
import usePreset from '@/composables/use-collection-preset';
import LayoutDrawerDetail from '@/views/private/components/layout-drawer-detail';
import SearchInput from '@/views/private/components/search-input';
import marked from 'marked';
import useNavigation from '../../composables/use-navigation';

type Item = {
	[field: string]: any;
};

export default defineComponent({
	name: 'users-browse',
	components: { UsersNavigation, LayoutDrawerDetail, SearchInput },
	props: {
		queryFilters: {
			type: Object as PropType<Record<string, string>>,
			default: null,
		},
	},
	setup(props) {
		const { roles } = useNavigation();
		const layout = ref<LayoutComponent | null>(null);

		const selection = ref<Item[]>([]);

		const { viewType, viewOptions, viewQuery, filters, searchQuery } = usePreset(ref('directus_users'));
		const { addNewLink, batchLink } = useLinks();
		const { confirmDelete, deleting, batchDelete } = useBatchDelete();
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

		return {
			_filters,
			addNewLink,
			batchDelete,
			batchLink,
			breadcrumb,
			title,
			confirmDelete,
			deleting,
			filters,
			layout,
			selection,
			viewOptions,
			viewQuery,
			viewType,
			searchQuery,
			marked,
			clearFilters,
		};

		function useBatchDelete() {
			const confirmDelete = ref(false);
			const deleting = ref(false);

			return { confirmDelete, deleting, batchDelete };

			async function batchDelete() {
				deleting.value = true;

				confirmDelete.value = false;

				const batchPrimaryKeys = selection.value;

				await api.delete(`/users/${batchPrimaryKeys}`);

				await layout.value?.refresh();

				selection.value = [];
				deleting.value = false;
				confirmDelete.value = false;
			}
		}

		function useLinks() {
			const addNewLink = computed<string>(() => {
				return `/users/+`;
			});

			const batchLink = computed<string>(() => {
				const batchPrimaryKeys = selection.value;
				return `/users/${batchPrimaryKeys}`;
			});

			return { addNewLink, batchLink };
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
				return roles.value?.find((role) => role.id === props.queryFilters.role)?.name;
			});

			return { breadcrumb, title };
		}

		function clearFilters() {
			filters.value = [];
			searchQuery.value = null;
		}
	},
});
</script>

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color: var(--danger-25);
	--v-button-color: var(--danger);
	--v-button-background-color-hover: var(--danger-50);
	--v-button-color-hover: var(--danger);
}

.action-batch {
	--v-button-background-color: var(--warning-25);
	--v-button-color: var(--warning);
	--v-button-background-color-hover: var(--warning-50);
	--v-button-color-hover: var(--warning);
}

.header-icon {
	--v-button-color-disabled: var(--foreground-normal);
}

.layout {
	--layout-offset-top: 64px;
}
</style>
