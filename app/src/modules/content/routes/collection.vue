<template>
	<component
		:is="layoutWrapper"
		ref="layoutRef"
		v-slot="{ layoutState }"
		v-model:selection="selection"
		v-model:layout-options="layoutOptions"
		v-model:layout-query="layoutQuery"
		:filter-user="filter"
		:filter-system="archiveFilter"
		:filter="mergeFilters(filter, archiveFilter)"
		:search="search"
		:collection="collection"
		:reset-preset="resetPreset"
		:clear-filters="clearFilters"
	>
		<content-not-found v-if="!currentCollection || collection.startsWith('directus_')" />
		<private-view
			v-else
			:title="bookmark ? bookmarkTitle : currentCollection.name"
			:small-header="currentLayout?.smallHeader"
			:header-shadow="currentLayout?.headerShadow"
			:sidebar-shadow="currentLayout?.sidebarShadow"
		>
			<template #title-outer:prepend>
				<v-button class="header-icon" :class="{ archive }" rounded icon secondary disabled>
					<v-icon :name="archive ? 'archive' : currentCollection.icon" :color="currentCollection.color" />
				</v-button>
			</template>

			<template #headline>
				<v-breadcrumb v-if="bookmark" :items="breadcrumb" />
				<v-breadcrumb v-else :items="[{ name: t('content'), to: '/content' }]" />
			</template>

			<template #title-outer:append>
				<div class="bookmark-controls">
					<bookmark-add
						v-if="!bookmark"
						v-model="bookmarkDialogActive"
						class="add"
						:saving="creatingBookmark"
						@save="createBookmark"
					>
						<template #activator="{ on }">
							<v-icon v-tooltip.right="t('create_bookmark')" class="toggle" clickable name="bookmark" @click="on" />
						</template>
					</bookmark-add>

					<v-icon v-else-if="bookmarkSaved" class="saved" name="bookmark" filled />

					<template v-else-if="bookmarkIsMine">
						<v-icon
							v-tooltip.bottom="t('update_bookmark')"
							class="save"
							clickable
							name="bookmark_save"
							@click="savePreset()"
						/>
					</template>

					<bookmark-add
						v-else
						v-model="bookmarkDialogActive"
						class="add"
						:saving="creatingBookmark"
						@save="createBookmark"
					>
						<template #activator="{ on }">
							<v-icon class="toggle" name="bookmark" clickable @click="on" />
						</template>
					</bookmark-add>

					<v-icon
						v-if="bookmark && !bookmarkSaving && bookmarkSaved === false"
						v-tooltip.bottom="t('reset_bookmark')"
						name="settings_backup_restore"
						clickable
						class="clear"
						@click="clearLocalSave"
					/>
				</div>
			</template>

			<template #actions:prepend>
				<component :is="`layout-actions-${layout || 'tabular'}`" v-bind="layoutState" />
			</template>

			<template #actions>
				<search-input v-model="search" v-model:filter="filter" :collection="collection" />

				<v-dialog v-if="selection.length > 0" v-model="confirmDelete" @esc="confirmDelete = false">
					<template #activator="{ on }">
						<v-button
							v-tooltip.bottom="batchDeleteAllowed ? t('delete_label') : t('not_allowed')"
							:disabled="batchDeleteAllowed !== true"
							rounded
							icon
							class="action-delete"
							secondary
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
							<v-button kind="danger" :loading="deleting" @click="batchDelete">
								{{ t('delete_label') }}
							</v-button>
						</v-card-actions>
					</v-card>
				</v-dialog>

				<v-dialog
					v-if="
						selection.length > 0 &&
						currentCollection.meta &&
						currentCollection.meta.archive_field &&
						archive !== 'archived'
					"
					v-model="confirmArchive"
					@esc="confirmArchive = false"
				>
					<template #activator="{ on }">
						<v-button
							v-tooltip.bottom="batchArchiveAllowed ? t('archive') : t('not_allowed')"
							:disabled="batchArchiveAllowed !== true"
							rounded
							icon
							secondary
							@click="on"
						>
							<v-icon name="archive" outline />
						</v-button>
					</template>

					<v-card>
						<v-card-title>{{ t('archive_confirm_count', selection.length) }}</v-card-title>

						<v-card-actions>
							<v-button secondary @click="confirmArchive = false">
								{{ t('cancel') }}
							</v-button>
							<v-button kind="warning" :loading="archiving" @click="archiveItems">
								{{ t('archive') }}
							</v-button>
						</v-card-actions>
					</v-card>
				</v-dialog>

				<v-button
					v-if="selection.length > 0"
					v-tooltip.bottom="batchEditAllowed ? t('edit') : t('not_allowed')"
					rounded
					icon
					secondary
					:disabled="batchEditAllowed === false"
					@click="batchEditActive = true"
				>
					<v-icon name="edit" outline />
				</v-button>

				<v-button
					v-tooltip.bottom="createAllowed ? t('create_item') : t('not_allowed')"
					rounded
					icon
					:to="addNewLink"
					:disabled="createAllowed === false"
				>
					<v-icon name="add" />
				</v-button>
			</template>

			<template #navigation>
				<content-navigation :current-collection="collection" />
			</template>

			<v-info
				v-if="bookmark && bookmarkExists === false"
				type="warning"
				:title="t('bookmark_doesnt_exist')"
				icon="bookmark"
				center
			>
				{{ t('bookmark_doesnt_exist_copy') }}

				<template #append>
					<v-button :to="currentCollectionLink">
						{{ t('bookmark_doesnt_exist_cta') }}
					</v-button>
				</template>
			</v-info>

			<component :is="`layout-${layout || 'tabular'}`" v-else v-bind="layoutState">
				<template #no-results>
					<v-info :title="t('no_results')" icon="search" center>
						{{ t('no_results_copy') }}

						<template #append>
							<v-button @click="clearFilters">{{ t('clear_filters') }}</v-button>
						</template>
					</v-info>
				</template>

				<template #no-items>
					<v-info :title="t('item_count', 0)" :icon="currentCollection.icon" center>
						{{ t('no_items_copy') }}

						<template v-if="createAllowed" #append>
							<v-button :to="`/content/${collection}/+`">{{ t('create_item') }}</v-button>
						</template>
					</v-info>
				</template>
			</component>

			<drawer-batch
				v-model:active="batchEditActive"
				:primary-keys="selection"
				:collection="collection"
				@refresh="batchRefresh"
			/>

			<template #sidebar>
				<sidebar-detail icon="info" :title="t('information')" close>
					<div
						v-md="t('page_help_collections_collection', { collection: currentCollection.name })"
						class="page-description"
					/>
				</sidebar-detail>
				<layout-sidebar-detail v-model="layout">
					<component :is="`layout-options-${layout || 'tabular'}`" v-bind="layoutState" />
				</layout-sidebar-detail>
				<component :is="`layout-sidebar-${layout || 'tabular'}`" v-bind="layoutState" />
				<archive-sidebar-detail v-if="hasArchive" :collection="collection" :archive="archive" />
				<refresh-sidebar-detail v-model="refreshInterval" @refresh="refresh" />
				<export-sidebar-detail
					:collection="collection"
					:filter="mergeFilters(filter, archiveFilter)"
					:search="search"
					:layout-query="layoutQuery"
					@download="download"
					@refresh="refresh"
				/>
				<flow-sidebar-detail
					location="collection"
					:collection="collection"
					:selection="selection"
					@refresh="batchRefresh"
				/>
			</template>

			<v-dialog :model-value="deleteError !== null">
				<v-card>
					<v-card-title>{{ t('something_went_wrong') }}</v-card-title>
					<v-card-text>
						<v-error :error="deleteError" />
					</v-card-text>
					<v-card-actions>
						<v-button @click="deleteError = null">{{ t('done') }}</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>
		</private-view>
	</component>
</template>

<script setup lang="ts">
import api from '@/api';
import { useExtension } from '@/composables/use-extension';
import { usePreset } from '@/composables/use-preset';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { unexpectedError } from '@/utils/unexpected-error';
import ArchiveSidebarDetail from '@/views/private/components/archive-sidebar-detail.vue';
import BookmarkAdd from '@/views/private/components/bookmark-add.vue';
import DrawerBatch from '@/views/private/components/drawer-batch.vue';
import ExportSidebarDetail from '@/views/private/components/export-sidebar-detail.vue';
import FlowSidebarDetail from '@/views/private/components/flow-sidebar-detail.vue';
import LayoutSidebarDetail from '@/views/private/components/layout-sidebar-detail.vue';
import RefreshSidebarDetail from '@/views/private/components/refresh-sidebar-detail.vue';
import SearchInput from '@/views/private/components/search-input.vue';
import { useCollection, useLayout } from '@directus/composables';
import { Filter } from '@directus/types';
import { mergeFilters } from '@directus/utils';
import { computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import ContentNavigation from '../components/navigation.vue';
import ContentNotFound from './not-found.vue';

type Item = {
	[field: string]: any;
};

const props = defineProps<{
	collection: string;
	bookmark?: string;
	archive?: string;
}>();

const { t } = useI18n();

const router = useRouter();

const userStore = useUserStore();
const permissionsStore = usePermissionsStore();
const layoutRef = ref();

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
	filter,
	search,
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

const { layoutWrapper } = useLayout(layout);

const {
	confirmDelete,
	deleting,
	batchDelete,
	confirmArchive,
	archiveItems,
	archiving,
	error: deleteError,
	batchEditActive,
} = useBatch();

const { bookmarkDialogActive, creatingBookmark, createBookmark } = useBookmarks();

const currentLayout = useExtension('layout', layout);

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

const hasArchive = computed(
	() =>
		currentCollection.value &&
		currentCollection.value.meta?.archive_field &&
		currentCollection.value.meta?.archive_app_filter
);

const archiveFilter = computed<Filter | null>(() => {
	if (!currentCollection.value?.meta) return null;
	if (!currentCollection.value?.meta?.archive_app_filter) return null;

	const field = currentCollection.value.meta.archive_field;

	if (!field) return null;

	let archiveValue: any = currentCollection.value.meta.archive_value;
	if (archiveValue === 'true') archiveValue = true;
	if (archiveValue === 'false') archiveValue = false;

	if (props.archive === 'all') {
		return null;
	} else if (props.archive === 'archived') {
		return {
			[field]: {
				_eq: archiveValue,
			},
		};
	} else {
		return {
			[field]: {
				_neq: archiveValue,
			},
		};
	}
});

async function refresh() {
	await layoutRef.value?.state?.refresh?.();
}

async function download() {
	await layoutRef.value?.state?.download?.();
}

async function batchRefresh() {
	selection.value = [];
	await refresh();
}

function useBreadcrumb() {
	const breadcrumb = computed(() => [
		{
			name: currentCollection.value?.name,
			to: `/content/${props.collection}`,
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

	const error = ref<any>(null);

	return { batchEditActive, confirmDelete, deleting, batchDelete, confirmArchive, archiving, archiveItems, error };

	async function batchDelete() {
		deleting.value = true;

		const batchPrimaryKeys = selection.value;

		try {
			await api.delete(`/items/${props.collection}`, {
				data: batchPrimaryKeys,
			});

			selection.value = [];
			await refresh();

			confirmDelete.value = false;
		} catch (err: any) {
			error.value = err;
		} finally {
			deleting.value = false;
		}
	}

	async function archiveItems() {
		if (!currentCollection.value?.meta?.archive_field) return;

		archiving.value = true;

		let archiveValue: any = currentCollection.value.meta.archive_value;
		if (archiveValue === 'true') archiveValue = true;
		if (archiveValue === 'false') archiveValue = false;

		try {
			await api.patch(`/items/${props.collection}`, {
				keys: selection.value,
				data: {
					[currentCollection.value.meta.archive_field]: archiveValue,
				},
			});

			selection.value = [];
			await refresh();

			confirmArchive.value = false;
		} catch (err: any) {
			error.value = err;
		} finally {
			archiving.value = false;
		}
	}
}

function useLinks() {
	const addNewLink = computed<string>(() => {
		return `/content/${props.collection}/+`;
	});

	const currentCollectionLink = computed<string>(() => {
		return `/content/${props.collection}`;
	});

	return { addNewLink, currentCollectionLink };
}

function useBookmarks() {
	const bookmarkDialogActive = ref(false);
	const creatingBookmark = ref(false);

	return {
		bookmarkDialogActive,
		creatingBookmark,
		createBookmark,
	};

	async function createBookmark(bookmark: any) {
		creatingBookmark.value = true;

		try {
			const newBookmark = await saveCurrentAsBookmark({
				bookmark: bookmark.name,
				icon: bookmark.icon,
				color: bookmark.color,
			});

			router.push(`/content/${newBookmark.collection}?bookmark=${newBookmark.id}`);

			bookmarkDialogActive.value = false;
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			creatingBookmark.value = false;
		}
	}
}

function clearFilters() {
	filter.value = null;
	search.value = null;
}

function usePermissions() {
	const batchEditAllowed = computed(() => {
		const admin = userStore?.currentUser?.role.admin_access === true;
		if (admin) return true;

		const updatePermissions = permissionsStore.permissions.find(
			(permission) => permission.action === 'update' && permission.collection === collection.value
		);

		return !!updatePermissions;
	});

	const batchArchiveAllowed = computed(() => {
		if (!currentCollection.value?.meta?.archive_field) return false;
		const admin = userStore?.currentUser?.role.admin_access === true;
		if (admin) return true;

		const updatePermissions = permissionsStore.permissions.find(
			(permission) => permission.action === 'update' && permission.collection === collection.value
		);

		if (!updatePermissions) return false;
		if (!updatePermissions.fields) return false;
		if (updatePermissions.fields.includes('*')) return true;
		return updatePermissions.fields.includes(currentCollection.value.meta.archive_field);
	});

	const batchDeleteAllowed = computed(() => {
		const admin = userStore?.currentUser?.role.admin_access === true;
		if (admin) return true;

		const deletePermissions = permissionsStore.permissions.find(
			(permission) => permission.action === 'delete' && permission.collection === collection.value
		);

		return !!deletePermissions;
	});

	const createAllowed = computed(() => {
		const admin = userStore?.currentUser?.role.admin_access === true;
		if (admin) return true;

		const createPermissions = permissionsStore.permissions.find(
			(permission) => permission.action === 'create' && permission.collection === collection.value
		);

		return !!createPermissions;
	});

	return { batchEditAllowed, batchArchiveAllowed, batchDeleteAllowed, createAllowed };
}
</script>

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color-hover: var(--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.header-icon {
	--v-button-color-disabled: var(--foreground-normal);
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
