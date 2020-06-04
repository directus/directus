<template>
	<private-view :title="$t('file_library')">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="folder" />
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

			<v-button rounded icon class="action-batch" v-if="selection.length > 1" :to="batchLink">
				<v-icon name="edit" />
			</v-button>

			<add-folder :parent="currentFolder" />

			<v-button rounded icon :to="addNewLink">
				<v-icon name="add" />
			</v-button>
		</template>

		<template #navigation>
			<files-navigation v-model="currentFolder" />
		</template>

		<component
			class="layout"
			ref="layout"
			:is="`layout-${viewType}`"
			collection="directus_files"
			:selection.sync="selection"
			:view-options.sync="viewOptions"
			:view-query.sync="viewQuery"
			:filters="filtersWithFolderAndType"
			:search-query="searchQuery"
			@update:filters="filters = $event"
			:detail-route="'/{{project}}/files/{{primaryKey}}'"
		/>

		<template #drawer>
			<drawer-detail icon="info_outline" :title="$t('information')" close>
				<div class="format-markdown" v-html="marked($t('page_help_files_browse'))" />
			</drawer-detail>
			<layout-drawer-detail @input="viewType = $event" :value="viewType" />
			<portal-target name="drawer" />
			<drawer-detail icon="help_outline" :title="$t('help_and_docs')">
				<div class="format-markdown" v-html="marked($t('page_help_files_browse'))" />
			</drawer-detail>
		</template>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from '@vue/composition-api';
import FilesNavigation from '../../components/navigation/';
import useProjectsStore from '@/stores/projects';
import { i18n } from '@/lang';
import api from '@/api';
import { LayoutComponent } from '@/layouts/types';
import useCollectionPreset from '@/composables/use-collection-preset';
import FilterDrawerDetail from '@/views/private/components/filter-drawer-detail';
import LayoutDrawerDetail from '@/views/private/components/layout-drawer-detail';
import AddFolder from '../../components/add-folder';
import SearchInput from '@/views/private/components/search-input';
import marked from 'marked';

type Item = {
	[field: string]: any;
};

export default defineComponent({
	name: 'files-browse',
	components: { FilesNavigation, FilterDrawerDetail, LayoutDrawerDetail, AddFolder, SearchInput },
	props: {},
	setup() {
		const layout = ref<LayoutComponent>(null);
		const projectsStore = useProjectsStore();

		const selection = ref<Item[]>([]);

		const { viewType, viewOptions, viewQuery, filters, searchQuery } = useCollectionPreset(ref('directus_files'));
		const { addNewLink, batchLink } = useLinks();
		const { confirmDelete, deleting, batchDelete } = useBatchDelete();
		const { breadcrumb } = useBreadcrumb();

		const currentFolder = ref(null);

		const filtersWithFolderAndType = computed(() => {
			if (currentFolder.value !== null) {
				return [
					...filters.value,
					{
						field: 'folder',
						operator: 'eq',
						value: currentFolder.value,
						locked: true,
					},
					{
						locked: true,
						field: 'type',
						operator: 'nnull',
						value: 1,
					},
				];
			}

			return [
				...filters.value,
				{
					locked: true,
					field: 'type',
					operator: 'nnull',
					value: 1,
				},
			];
		});

		if (viewType.value === null) {
			viewType.value = 'cards';
		}

		if (viewOptions.value === null && viewType.value === 'cards') {
			viewOptions.value = {
				icon: 'insert_drive_file',
				title: '{{title}}',
				subtitle: '{{type}} • {{filesize}}',
			};
		}

		return {
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
			currentFolder,
			filtersWithFolderAndType,
			searchQuery,
			marked,
		};

		function useBatchDelete() {
			const confirmDelete = ref(false);
			const deleting = ref(false);

			return { confirmDelete, deleting, batchDelete };

			async function batchDelete() {
				const currentProjectKey = projectsStore.state.currentProjectKey;

				deleting.value = true;

				confirmDelete.value = false;

				const batchPrimaryKeys = selection.value;

				await api.delete(`/${currentProjectKey}/files/${batchPrimaryKeys}`);

				await layout.value?.refresh();

				selection.value = [];
				deleting.value = false;
				confirmDelete.value = false;
			}
		}

		function useLinks() {
			const addNewLink = computed<string>(() => {
				const currentProjectKey = projectsStore.state.currentProjectKey;
				return `/${currentProjectKey}/files/+`;
			});

			const batchLink = computed<string>(() => {
				const currentProjectKey = projectsStore.state.currentProjectKey;
				const batchPrimaryKeys = selection.value;
				return `/${currentProjectKey}/files/${batchPrimaryKeys}`;
			});

			return { addNewLink, batchLink };
		}

		function useBreadcrumb() {
			const breadcrumb = computed(() => {
				const currentProjectKey = projectsStore.state.currentProjectKey;

				return [
					{
						name: i18n.tc('collection', 2),
						to: `/${currentProjectKey}/collections`,
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
