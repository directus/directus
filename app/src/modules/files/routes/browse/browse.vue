<template>
	<private-view :title="title">
		<template #headline v-if="breadcrumb">
			<v-breadcrumb :items="breadcrumb" />
		</template>

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

			<add-folder :parent="queryFilters && queryFilters.folder" />

			<v-dialog v-model="moveToDialogActive" v-if="selection.length > 0">
				<template #activator="{ on }">
					<v-button rounded icon @click="on" class="folder" v-tooltip.bottom="$t('move_to_folder')">
						<v-icon name="folder_move" />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ $t('move_to_folder') }}</v-card-title>

					<v-card-text>
						<folder-picker v-model="selectedFolder" />
					</v-card-text>

					<v-card-actions>
						<v-button @click="moveToDialogActive = false" secondary>
							{{ $t('cancel') }}
						</v-button>
						<v-button @click="moveToFolder" :loading="moving">
							{{ $t('move') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-dialog v-model="confirmDelete" v-if="selection.length > 0">
				<template #activator="{ on }">
					<v-button rounded icon class="action-delete" @click="on" v-tooltip.bottom="$t('delete')">
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

			<v-button
				rounded
				icon
				class="add-new"
				:to="{ path: '/files/+', query: queryFilters }"
				v-tooltip.bottom="$t('add_file')"
			>
				<v-icon name="add" />
			</v-button>
		</template>

		<template #navigation>
			<files-navigation :current-folder="queryFilters && queryFilters.folder" />
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
				<v-info :title="$tc('file_count', 0)" icon="folder" center>
					{{ $t('no_files_copy') }}

					<template #append>
						<v-button :to="{ path: '/files/+', query: queryFilters }">{{ $t('add_file') }}</v-button>
					</template>
				</v-info>
			</template>
		</component>

		<router-view name="addNew" :preset="queryFilters" @upload="refresh" />

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
import { defineComponent, computed, ref, PropType, onMounted, onUnmounted } from '@vue/composition-api';
import FilesNavigation from '../../components/navigation/';
import { i18n } from '@/lang';
import api from '@/api';
import { LayoutComponent } from '@/layouts/types';
import usePreset from '@/composables/use-collection-preset';
import FilterDrawerDetail from '@/views/private/components/filter-drawer-detail';
import LayoutDrawerDetail from '@/views/private/components/layout-drawer-detail';
import AddFolder from '../../components/add-folder';
import SearchInput from '@/views/private/components/search-input';
import marked from 'marked';
import FolderPicker from '../../components/folder-picker';
import emitter, { Events } from '@/events';
import router from '@/router';
import Vue from 'vue';
import { useUserStore } from '@/stores';
import { subDays } from 'date-fns';
import useFolders from '../../composables/use-folders';

type Item = {
	[field: string]: any;
};

export default defineComponent({
	name: 'files-browse',
	components: { FilesNavigation, FilterDrawerDetail, LayoutDrawerDetail, AddFolder, SearchInput, FolderPicker },
	props: {
		queryFilters: {
			type: Object as PropType<Record<string, string>>,
			default: null,
		},
		special: {
			type: String as PropType<'all' | 'recent' | 'mine'>,
			default: null,
		},
	},
	setup(props) {
		const { folders } = useFolders();
		const layout = ref<LayoutComponent | null>(null);
		const selection = ref<Item[]>([]);

		const userStore = useUserStore();

		const { viewType, viewOptions, viewQuery, filters, searchQuery } = usePreset(ref('directus_files'));
		const { batchLink } = useLinks();
		const { confirmDelete, deleting, batchDelete } = useBatchDelete();
		const { breadcrumb, title } = useBreadcrumb();

		const filtersWithFolderAndType = computed(() => {
			const filtersParsed: any[] = [
				...filters.value,
				{
					locked: true,
					field: 'type',
					operator: 'nnull',
					value: 1,
				},
			];

			if (props.special === null) {
				if (Object.keys(props.queryFilters).length > 0) {
					for (const [field, value] of Object.entries(props.queryFilters)) {
						filtersParsed.push({
							locked: true,
							operator: 'eq',
							field,
							value,
						});
					}
				} else {
					filtersParsed.push({
						locked: true,
						operator: 'null',
						field: 'folder',
						value: true,
					});
				}
			}

			if (props.special === 'mine' && userStore.state.currentUser) {
				filtersParsed.push({
					locked: true,
					operator: 'eq',
					field: 'uploaded_by',
					value: userStore.state.currentUser.id,
				});
			}

			if (props.special === 'recent') {
				filtersParsed.push({
					locked: true,
					operator: 'gt',
					field: 'uploaded_on',
					value: subDays(new Date(), 5).toISOString(),
				});
			}

			return filtersParsed;
		});

		const { moveToDialogActive, moveToFolder, moving, selectedFolder } = useMovetoFolder();

		onMounted(() => emitter.on(Events.upload, refresh));
		onUnmounted(() => emitter.off(Events.upload, refresh));

		return {
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
			filtersWithFolderAndType,
			searchQuery,
			marked,
			moveToDialogActive,
			moveToFolder,
			moving,
			selectedFolder,
			refresh,
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

				await api.delete(`/files/${batchPrimaryKeys}`);

				await layout.value?.refresh();

				selection.value = [];
				deleting.value = false;
				confirmDelete.value = false;
			}
		}

		function useLinks() {
			const batchLink = computed<string>(() => {
				const batchPrimaryKeys = selection.value;
				return `/files/${batchPrimaryKeys}`;
			});

			return { batchLink };
		}

		function useBreadcrumb() {
			const title = computed(() => {
				if (props.special === 'all') {
					return i18n.t('all_files');
				}

				if (props.special === 'mine') {
					return i18n.t('my_files');
				}

				if (props.special === 'recent') {
					return i18n.t('recent_files');
				}

				if (props.queryFilters?.folder) {
					const folder = folders.value?.find((folder) => folder.id === props.queryFilters.folder);

					if (folder) {
						return folder.name;
					}
				}

				return i18n.t('file_library');
			});

			const breadcrumb = computed(() => {
				if (title.value !== i18n.t('file_library')) {
					return [
						{
							name: i18n.t('file_library'),
							to: `/files`,
						},
					];
				}

				return null;
			});

			return { breadcrumb, title };
		}

		function useMovetoFolder() {
			const moveToDialogActive = ref(false);
			const moving = ref(false);
			const selectedFolder = ref<number | null>();

			return { moveToDialogActive, moving, moveToFolder, selectedFolder };

			async function moveToFolder() {
				moving.value = true;
				try {
					await api.patch(`/files/${selection.value}`, {
						folder: selectedFolder.value,
					});

					selection.value = [];

					if (selectedFolder.value) {
						router.push(`/files?folder=${selectedFolder.value}`);
					}

					await Vue.nextTick();
					await refresh();
				} catch (err) {
					console.error(err);
				} finally {
					moveToDialogActive.value = false;
					moving.value = false;
				}
			}
		}

		function refresh() {
			layout.value?.refresh();
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

.folder {
	--v-button-background-color: var(--primary-25);
	--v-button-color: var(--primary);
	--v-button-background-color-hover: var(--primary-50);
	--v-button-color-hover: var(--primary);
}

.header-icon {
	--v-button-color-disabled: var(--foreground-normal);
}

.layout {
	--layout-offset-top: 64px;
}
</style>
