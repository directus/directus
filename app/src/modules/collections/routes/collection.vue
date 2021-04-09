<template>
	<collections-not-found v-if="!currentCollection || collection.startsWith('directus_')" />
	<private-view v-else :title="bookmark ? bookmarkTitle : currentCollection.name">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon secondary disabled>
				<v-icon :name="currentCollection.icon" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb v-if="bookmark" :items="breadcrumb" />
			<v-breadcrumb v-else :items="[{ name: $t('collections'), to: '/collections' }]" />
		</template>

		<template #title-outer:append>
			<div class="bookmark-controls">
				<bookmark-add
					v-if="!bookmark"
					class="add"
					v-model="bookmarkDialogActive"
					@save="createBookmark"
					:saving="creatingBookmark"
				>
					<template #activator="{ on }">
						<v-icon class="toggle" @click="on" name="bookmark_outline" v-tooltip.right="$t('create_bookmark')" />
					</template>
				</bookmark-add>

				<v-icon class="saved" name="bookmark" v-else-if="bookmarkSaved" />

				<template v-else-if="bookmarkIsMine">
					<v-icon class="save" @click="savePreset()" name="bookmark_save" v-tooltip.bottom="$t('update_bookmark')" />
				</template>

				<bookmark-add
					v-else
					class="add"
					v-model="bookmarkDialogActive"
					@save="createBookmark"
					:saving="creatingBookmark"
				>
					<template #activator="{ on }">
						<v-icon class="toggle" name="bookmark_outline" @click="on" />
					</template>
				</bookmark-add>

				<v-icon
					v-if="bookmark && !bookmarkSaving && bookmarkSaved === false"
					name="settings_backup_restore"
					@click="clearLocalSave"
					class="clear"
					v-tooltip.bottom="$t('reset_bookmark')"
				/>
			</div>
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

			<v-dialog
				v-model="confirmArchive"
				@esc="confirmArchive = false"
				v-if="selection.length > 0 && currentCollection.meta && currentCollection.meta.archive_field"
			>
				<template #activator="{ on }">
					<v-button
						:disabled="batchArchiveAllowed !== true"
						rounded
						icon
						class="action-archive"
						@click="on"
						v-tooltip.bottom="batchArchiveAllowed ? $t('archive') : $t('not_allowed')"
					>
						<v-icon name="archive" outline />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ $tc('archive_confirm_count', selection.length) }}</v-card-title>

					<v-card-actions>
						<v-button @click="confirmArchive = false" secondary>
							{{ $t('cancel') }}
						</v-button>
						<v-button @click="archive" class="action-archive" :loading="archiving">
							{{ $t('archive') }}
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
			<collections-navigation-search />
			<collections-navigation exact />
		</template>

		<v-info
			type="warning"
			v-if="bookmark && bookmarkExists === false"
			:title="$t('bookmark_doesnt_exist')"
			icon="bookmark"
			center
		>
			{{ $t('bookmark_doesnt_exist_copy') }}

			<template #append>
				<v-button :to="currentCollectionLink">
					{{ $t('bookmark_doesnt_exist_cta') }}
				</v-button>
			</template>
		</v-info>

		<component
			v-else
			class="layout"
			ref="layoutRef"
			:is="`layout-${layout || 'tabular'}`"
			:collection="collection"
			:selection.sync="selection"
			:layout-options.sync="layoutOptions"
			:layout-query.sync="layoutQuery"
			:filters.sync="filters"
			:search-query.sync="searchQuery"
			:reset-preset="resetPreset"
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
				<v-info :title="$tc('item_count', 0)" :icon="currentCollection.icon" center>
					{{ $t('no_items_copy') }}

					<template #append v-if="createAllowed">
						<v-button :to="`/collections/${collection}/+`">{{ $t('create_item') }}</v-button>
					</template>
				</v-info>
			</template>
		</component>

		<drawer-batch
			:primary-keys="selection"
			:active.sync="batchEditActive"
			:collection="collection"
			@refresh="refresh"
		/>

		<template #sidebar>
			<sidebar-detail icon="info_outline" :title="$t('information')" close>
				<div
					class="page-description"
					v-html="
						marked(
							$t('page_help_collections_collection', {
								collection: currentCollection.name,
							})
						)
					"
				/>
			</sidebar-detail>
			<layout-sidebar-detail @input="layout = $event" :value="layout" />
			<portal-target name="sidebar" />
			<export-sidebar-detail :layout-query="layoutQuery" :search-query="searchQuery" :collection="currentCollection" />
			<refresh-sidebar-detail @refresh="refresh" v-model="refreshInterval" />
		</template>

		<v-dialog v-if="deleteError" active>
			<v-card>
				<v-card-title>{{ $t('something_went_wrong') }}</v-card-title>
				<v-card-text>
					<v-error :error="deleteError" />
				</v-card-text>
				<v-card-actions>
					<v-button @click="deleteError = null">{{ $t('done') }}</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, toRefs } from '@vue/composition-api';
import CollectionsNavigation from '../components/navigation.vue';
import CollectionsNavigationSearch from '../components/navigation-search.vue';
import api from '@/api';
import { LayoutComponent } from '@/layouts/types';
import CollectionsNotFound from './not-found.vue';
import useCollection from '@/composables/use-collection';
import usePreset from '@/composables/use-preset';
import LayoutSidebarDetail from '@/views/private/components/layout-sidebar-detail';
import ExportSidebarDetail from '@/views/private/components/export-sidebar-detail';
import RefreshSidebarDetail from '@/views/private/components/refresh-sidebar-detail';
import SearchInput from '@/views/private/components/search-input';
import BookmarkAdd from '@/views/private/components/bookmark-add';
import BookmarkEdit from '@/views/private/components/bookmark-edit';
import router from '@/router';
import marked from 'marked';
import { usePermissionsStore, useUserStore } from '@/stores';
import DrawerBatch from '@/views/private/components/drawer-batch';
import { unexpectedError } from '@/utils/unexpected-error';

type Item = {
	[field: string]: any;
};

export default defineComponent({
	name: 'collections-collection',
	components: {
		CollectionsNavigation,
		CollectionsNavigationSearch,
		CollectionsNotFound,
		LayoutSidebarDetail,
		ExportSidebarDetail,
		SearchInput,
		BookmarkAdd,
		BookmarkEdit,
		DrawerBatch,
		RefreshSidebarDetail,
	},
	props: {
		collection: {
			type: String,
			required: true,
		},
		bookmark: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const userStore = useUserStore();
		const permissionsStore = usePermissionsStore();
		const layoutRef = ref<LayoutComponent | null>(null);

		const { collection } = toRefs(props);
		const bookmarkID = computed(() => (props.bookmark ? +props.bookmark : null));

		const { selection } = useSelection();
		const { info: currentCollection } = useCollection(collection);
		const { addNewLink, currentCollectionLink } = useLinks();
		const { breadcrumb } = useBreadcrumb();

		const {
			layout,
			layoutOptions,
			layoutQuery,
			filters,
			searchQuery,
			savePreset,
			bookmarkExists,
			saveCurrentAsBookmark,
			bookmarkTitle,
			resetPreset,
			bookmarkSaved,
			bookmarkIsMine,
			refreshInterval,
			busy: bookmarkSaving,
			clearLocalSave,
		} = usePreset(collection, bookmarkID);

		const {
			confirmDelete,
			deleting,
			batchDelete,
			confirmArchive,
			archive,
			archiving,
			error: deleteError,
			batchEditActive,
		} = useBatch();

		const { bookmarkDialogActive, creatingBookmark, createBookmark, editingBookmark, editBookmark } = useBookmarks();

		watch(
			collection,
			() => {
				if (layout.value === null) {
					layout.value = 'tabular';
				}
			},
			{ immediate: true }
		);

		const { batchEditAllowed, batchArchiveAllowed, batchDeleteAllowed, createAllowed } = usePermissions();

		return {
			addNewLink,
			batchDelete,
			batchEditActive,
			confirmDelete,
			currentCollection,
			deleting,
			filters,
			layoutRef,
			selection,
			layoutOptions,
			layoutQuery,
			layout,
			searchQuery,
			savePreset,
			bookmarkExists,
			currentCollectionLink,
			bookmarkDialogActive,
			creatingBookmark,
			createBookmark,
			bookmarkTitle,
			editingBookmark,
			editBookmark,
			breadcrumb,
			marked,
			clearFilters,
			confirmArchive,
			archive,
			archiving,
			batchEditAllowed,
			batchArchiveAllowed,
			batchDeleteAllowed,
			deleteError,
			createAllowed,
			resetPreset,
			bookmarkSaved,
			bookmarkIsMine,
			bookmarkSaving,
			clearLocalSave,
			refresh,
			refreshInterval,
		};

		function refresh() {
			layoutRef.value?.refresh?.();
		}

		function useBreadcrumb() {
			const breadcrumb = computed(() => [
				{
					name: currentCollection.value?.name,
					to: `/collections/${props.collection}`,
				},
			]);

			return { breadcrumb };
		}

		function useSelection() {
			const selection = ref<Item[]>([]);

			// Whenever the collection we're working on changes, we have to clear the selection
			watch(
				() => props.collection,
				() => (selection.value = [])
			);

			return { selection };
		}

		function useBatch() {
			const confirmDelete = ref(false);
			const deleting = ref(false);

			const batchEditActive = ref(false);

			const confirmArchive = ref(false);
			const archiving = ref(false);

			const error = ref<any>();

			return { batchEditActive, confirmDelete, deleting, batchDelete, confirmArchive, archiving, archive, error };

			async function batchDelete() {
				deleting.value = true;

				const batchPrimaryKeys = selection.value;

				try {
					await api.delete(`/items/${props.collection}`, {
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

			async function archive() {
				if (!currentCollection.value?.meta?.archive_field) return;

				archiving.value = true;

				try {
					await api.patch(`/items/${props.collection}`, {
						keys: selection.value,
						data: {
							[currentCollection.value.meta.archive_field]: currentCollection.value.meta.archive_value,
						},
					});

					confirmArchive.value = false;
					selection.value = [];

					await layoutRef.value?.refresh?.();
				} catch (err) {
					error.value = err;
				} finally {
					archiving.value = false;
				}
			}
		}

		function useLinks() {
			const addNewLink = computed<string>(() => {
				return `/collections/${props.collection}/+`;
			});

			const currentCollectionLink = computed<string>(() => {
				return `/collections/${props.collection}`;
			});

			return { addNewLink, currentCollectionLink };
		}

		function useBookmarks() {
			const bookmarkDialogActive = ref(false);
			const creatingBookmark = ref(false);
			const editingBookmark = ref(false);

			return {
				bookmarkDialogActive,
				creatingBookmark,
				createBookmark,
				editingBookmark,
				editBookmark,
			};

			async function createBookmark(name: string) {
				creatingBookmark.value = true;

				try {
					const newBookmark = await saveCurrentAsBookmark({ bookmark: name });
					router.push(`/collections/${newBookmark.collection}?bookmark=${newBookmark.id}`);

					bookmarkDialogActive.value = false;
				} catch (err) {
					unexpectedError(err);
				} finally {
					creatingBookmark.value = false;
				}
			}

			async function editBookmark(name: string) {
				bookmarkTitle.value = name;
				bookmarkDialogActive.value = false;
			}
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
					(permission) => permission.action === 'update' && permission.collection === collection.value
				);
				return !!updatePermissions;
			});

			const batchArchiveAllowed = computed(() => {
				if (!currentCollection.value?.meta?.archive_field) return false;
				const admin = userStore.state?.currentUser?.role.admin_access === true;
				if (admin) return true;

				const updatePermissions = permissionsStore.state.permissions.find(
					(permission) => permission.action === 'update' && permission.collection === collection.value
				);
				if (!updatePermissions) return false;
				if (!updatePermissions.fields) return false;
				if (updatePermissions.fields.includes('*')) return true;
				return updatePermissions.fields.includes(currentCollection.value.meta.archive_field);
			});

			const batchDeleteAllowed = computed(() => {
				const admin = userStore.state?.currentUser?.role.admin_access === true;
				if (admin) return true;

				const deletePermissions = permissionsStore.state.permissions.find(
					(permission) => permission.action === 'delete' && permission.collection === collection.value
				);
				return !!deletePermissions;
			});

			const createAllowed = computed(() => {
				const admin = userStore.state?.currentUser?.role.admin_access === true;
				if (admin) return true;

				const createPermissions = permissionsStore.state.permissions.find(
					(permission) => permission.action === 'create' && permission.collection === collection.value
				);
				return !!createPermissions;
			});

			return { batchEditAllowed, batchArchiveAllowed, batchDeleteAllowed, createAllowed };
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

.action-archive {
	--v-button-background-color: var(--warning-10);
	--v-button-color: var(--warning);
	--v-button-background-color-hover: var(--warning-25);
	--v-button-color-hover: var(--warning);
}

.action-batch {
	--v-button-background-color: var(--warning-10);
	--v-button-color: var(--warning);
	--v-button-background-color-hover: var(--warning-25);
	--v-button-color-hover: var(--warning);
}

.header-icon.secondary {
	--v-button-background-color: var(--background-normal);
	--v-button-background-color-activated: var(--background-normal);
	--v-button-background-color-hover: var(--background-normal-alt);
}

.header-icon {
	--v-button-color-disabled: var(--foreground-normal);
}

.layout {
	--layout-offset-top: 64px;
}

.bookmark-controls {
	.add,
	.save,
	.saved,
	.clear {
		display: inline-block;
		margin-left: 8px;
	}

	.add,
	.save,
	.clear {
		cursor: pointer;
		transition: color var(--fast) var(--transition);
	}

	.add {
		color: var(--foreground-subdued);

		&:hover {
			color: var(--foreground-normal);
		}
	}

	.save {
		color: var(--warning);

		&:hover {
			color: var(--warning-125);
		}
	}

	.clear {
		margin-left: 4px;
		color: var(--foreground-subdued);

		&:hover {
			color: var(--warning);
		}
	}

	.saved {
		color: var(--primary);
	}
}
</style>
