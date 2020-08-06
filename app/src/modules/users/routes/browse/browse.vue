<template>
	<private-view :title="$t('user_directory')">
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

			<v-button rounded icon class="action-batch" v-if="selection.length > 1" :to="batchLink" v-tooltip.bottom="$t('edit')">
				<v-icon name="edit" />
			</v-button>

			<v-button rounded icon :to="addNewLink" v-tooltip.bottom="$t('add_user')">
				<v-icon name="add" />
			</v-button>
		</template>

		<template #navigation>
			<users-navigation />
		</template>

		<component
			class="layout"
			ref="layout"
			:is="`layout-${viewType}`"
			collection="directus_users"
			:selection.sync="selection"
			:view-options.sync="viewOptions"
			:view-query.sync="viewQuery"
			:detail-route="'/users/{{item.role}}/{{primaryKey}}'"
			:filters="_filters"
			:search-query="searchQuery"
			@update:filters="filters = $event"
		/>

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
import { defineComponent, computed, ref } from '@vue/composition-api';
import UsersNavigation from '../../components/navigation/';

import { i18n } from '@/lang';
import api from '@/api';
import { LayoutComponent } from '@/layouts/types';
import usePreset from '@/composables/use-collection-preset';
import FilterDrawerDetail from '@/views/private/components/filter-drawer-detail';
import LayoutDrawerDetail from '@/views/private/components/layout-drawer-detail';
import SearchInput from '@/views/private/components/search-input';
import marked from 'marked';

type Item = {
	[field: string]: any;
};

export default defineComponent({
	name: 'users-browse',
	components: { UsersNavigation, FilterDrawerDetail, LayoutDrawerDetail, SearchInput },
	props: {
		role: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const layout = ref<LayoutComponent | null>(null);

		const selection = ref<Item[]>([]);

		const { viewType, viewOptions, viewQuery, filters, searchQuery } = usePreset(ref('directus_users'));
		const { addNewLink, batchLink } = useLinks();
		const { confirmDelete, deleting, batchDelete } = useBatchDelete();
		const { breadcrumb } = useBreadcrumb();

		const _filters = computed(() => {
			if (props.role !== null) {
				return [
					{
						locked: true,
						field: 'role',
						operator: 'eq',
						value: props.role,
					},
					...filters.value,
				];
			}

			return [
				// This filter is basically a no-op. Every user has a role. However, by filtering on
				// this field, we can ensure that the field data is fetched, which is needed to build
				// out the navigation links
				{
					locked: true,
					field: 'role',
					operator: 'nnull',
					value: 1,
				},
				...filters.value,
			];
		});

		if (viewType.value === null) {
			viewType.value = 'cards';
		}

		if (viewOptions.value === null) {
			if (viewType.value === 'cards') {
				viewOptions.value = {
					icon: 'person',
					title: '{{first_name}} {{last_name}}',
					subtitle: '{{ title }}',
					size: 4
				};
			}
		}

		return {
			_filters,
			addNewLink,
			batchDelete,
			batchLink,
			breadcrumb,
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
				return [
					{
						name: i18n.tc('collection', 2),
						to: `/collections`,
					},
				];
			});

			return { breadcrumb };
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
