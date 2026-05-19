<script setup lang="ts">
import { translateShortcut, useCollection, useLayout, useShortcut } from '@directus/composables';
import { isPublishedVersionKey, VERSION_KEY_DRAFT } from '@directus/constants';
import { isSystemCollection } from '@directus/system-data';
import { Filter, Preset } from '@directus/types';
import { mergeFilters } from '@directus/utils';
import { isNil } from 'lodash';
import { computed, ref, toRefs, watch } from 'vue';
import { onBeforeRouteUpdate, useRouter } from 'vue-router';
import BookmarkAdd from '../components/bookmark-add.vue';
import BookmarkDelete from '../components/bookmark-delete.vue';
import ContentNavigation from '../components/navigation.vue';
import VersionChip from '../components/version-chip.vue';
import { useDeleteBookmark } from '../composables/use-delete-bookmark';
import { stripVersionWithoutReadAccess } from '../index';
import { getBookmarkScope } from '../utils/get-bookmark-scope';
import ContentNotFound from './not-found.vue';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VError from '@/components/v-error.vue';
import VInfo from '@/components/v-info.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import { useFlows } from '@/composables/use-flows';
import { useCollectionPermissions } from '@/composables/use-permissions';
import { usePreset } from '@/composables/use-preset';
import { useVersionQuery } from '@/composables/use-version-query';
import { useCollectionsStore } from '@/stores/collections';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { getCollectionRoute, getItemRoute } from '@/utils/get-route';
import { getVersionDisplayName } from '@/utils/get-version-display-name';
import { unexpectedError } from '@/utils/unexpected-error';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';
import ArchiveSidebarDetail from '@/views/private/components/archive-sidebar-detail.vue';
import DrawerBatch from '@/views/private/components/drawer-batch.vue';
import ExportSidebarDetail from '@/views/private/components/export-sidebar-detail.vue';
import FlowDialogs from '@/views/private/components/flow-dialogs.vue';
import FlowSidebarDetail from '@/views/private/components/flow-sidebar-detail.vue';
import LayoutSidebarDetail from '@/views/private/components/layout-sidebar-detail.vue';
import RefreshSidebarDetail from '@/views/private/components/refresh-sidebar-detail.vue';
import SearchInput from '@/views/private/components/search-input.vue';

type Item = {
	[field: string]: any;
};

const props = defineProps<{
	collection: string;
	bookmark?: string;
	archive?: string;
}>();

const router = useRouter();
const collectionsStore = useCollectionsStore();

const layoutRef = ref();

const { collection } = toRefs(props);
const bookmarkID = computed(() => (props.bookmark ? +props.bookmark : null));

const { info: currentCollection } = useCollection(collection);
const { isVersioned, isVersion, version, versionName, versionKeyQuery, readVersionsAllowed } = useVersion();
const { selection } = useSelection();

onBeforeRouteUpdate((to) => {
	const collectionParam = typeof to.params.collection === 'string' ? to.params.collection : undefined;
	if (!collectionParam) return true;

	if (collectionsStore.getCollection(collectionParam)?.meta?.singleton) {
		return { name: 'content-singleton', params: to.params, query: to.query };
	}

	const stripped = stripVersionWithoutReadAccess(to);
	if (stripped) return stripped;

	return true;
});

const { addNewLink, currentCollectionLink } = useLinks();

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
	localPreset,
} = usePreset(collection, bookmarkID);

const { headerTitle, headerIcon, headerIconColor } = useCollectionHeader();

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

const {
	bookmarkDialogActive,
	creatingBookmark,
	isBookmarkUpdateable,
	isBookmarkResetable,
	createBookmark,
	bookmarkPreset,
	bookmarkScope,
	hasBookmarkPermission,
	deleteActive,
	deleteSaving,
	deleteSave,
} = useBookmarks();

watch(
	collection,
	() => {
		if (layout.value === null) {
			layout.value = 'tabular';
		}
	},
	{ immediate: true },
);

const {
	updateAllowed: batchEditAllowed,
	archiveAllowed: batchArchiveAllowed,
	deleteAllowed: batchDeleteAllowed,
	createAllowed,
} = useCollectionPermissions(collection);

const createNewAllowed = computed(() => {
	if (isVersioned.value) return createAllowed.value && readVersionsAllowed.value;
	return createAllowed.value;
});

useShortcut('meta+alt+n', () => {
	if (!createAllowed.value) return;
	router.push(addNewLink.value);
});

const permissionsStore = usePermissionsStore();

const hasArchive = computed(() => {
	const archiveField = currentCollection.value?.meta?.archive_field;
	if (!archiveField || !currentCollection.value?.meta?.archive_app_filter) return false;

	const permissions = permissionsStore.getPermission(collection.value, 'read');
	if (permissions?.access === 'none') return false;

	const hasArchiveFieldPermission = permissions?.fields?.[0] === '*' || permissions?.fields?.includes(archiveField);
	return hasArchiveFieldPermission;
});

const archiveFilter = computed<Filter | null>(() => {
	if (!hasArchive.value) return null;

	const field = currentCollection.value!.meta!.archive_field!;
	let archiveValue: any = currentCollection.value!.meta!.archive_value;
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

const { flowDialogsContext, manualFlows, provideRunManualFlow } = useFlows({
	collection,
	selection,
	location: 'collection',
	onRefreshCallback: refresh,
});

provideRunManualFlow();

async function refresh() {
	await layoutRef.value?.state?.refresh?.();
}

const downloadHandler = computed(() => layoutRef.value?.state?.download);

async function batchRefresh() {
	selection.value = [];
	await refresh();
}

function useCollectionHeader() {
	const headerTitle = computed(() => {
		if (props.bookmark) return bookmarkTitle.value ?? undefined;
		return currentCollection.value?.name;
	});

	const headerIcon = computed(() => {
		if (props.archive) return 'archive';
		if (props.bookmark) return localPreset.value.icon ?? undefined;
		return currentCollection.value?.icon;
	});

	const headerIconColor = computed(() => {
		if (props.bookmark) return localPreset.value.color ?? undefined;
		return currentCollection.value?.color ?? undefined;
	});

	return { headerTitle, headerIcon, headerIconColor };
}

function useSelection() {
	const selection = ref<Item[]>([]);

	// Clear selection when the collection changes or when switching version mode
	// (stale keys across modes — draft selections are version_ids, published are primary keys)
	watch([() => props.collection, versionKeyQuery], () => (selection.value = []));

	return { selection };
}

function useVersion() {
	const versionKeyQuery = useVersionQuery();
	const isVersioned = computed(() => !!currentCollection.value?.meta?.versioning);
	const { readAllowed: readVersionsAllowed } = useCollectionPermissions('directus_versions');
	const version = computed(() => getValidVersion());
	const versionName = computed(() => getVersionDisplayName(version.value ? { key: version.value, name: null } : null));
	const isVersion = computed(() => !isNil(version.value));

	return { isVersioned, isVersion, version, versionName, versionKeyQuery, readVersionsAllowed };

	function getValidVersion() {
		if (!isVersioned.value) return undefined;
		if (!readVersionsAllowed.value) return null;
		if (versionKeyQuery.value === VERSION_KEY_DRAFT) return VERSION_KEY_DRAFT;
		if (!versionKeyQuery.value || isPublishedVersionKey(versionKeyQuery.value)) return null;
		return undefined;
	}
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
		if (deleting.value) return;

		deleting.value = true;

		try {
			if (isVersion.value) {
				await api.delete('/versions', { data: selection.value });
			} else {
				await api.delete(`/items/${props.collection}`, { data: selection.value });
			}

			selection.value = [];
			await refresh();
		} catch (err: any) {
			error.value = err;
		} finally {
			confirmDelete.value = false;
			deleting.value = false;
		}
	}

	async function archiveItems() {
		if (archiving.value || !currentCollection.value?.meta?.archive_field) return;

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
	const addNewLink = computed<string>(() => getItemRoute(props.collection, '+', version.value));

	const currentCollectionLink = computed<string>(() => {
		return getCollectionRoute(props.collection);
	});

	return { addNewLink, currentCollectionLink };
}

function useBookmarks() {
	const userStore = useUserStore();

	const bookmarkDialogActive = ref(false);
	const creatingBookmark = ref(false);
	const isBookmarkUpdateable = computed(() => props.bookmark && !bookmarkSaved.value && bookmarkIsMine.value);
	const isBookmarkResetable = computed(() => props.bookmark && !bookmarkSaved.value && !bookmarkSaving.value);

	const bookmarkPreset = computed(() => localPreset.value as Preset);
	const bookmarkScope = computed(() => getBookmarkScope(bookmarkPreset.value));
	const hasBookmarkPermission = computed(() => bookmarkIsMine.value || userStore.isAdmin);

	const { deleteActive, deleteSaving, deleteSave } = useDeleteBookmark();

	return {
		bookmarkDialogActive,
		creatingBookmark,
		isBookmarkUpdateable,
		isBookmarkResetable,
		createBookmark,
		bookmarkPreset,
		bookmarkScope,
		hasBookmarkPermission,
		deleteActive,
		deleteSaving,
		deleteSave,
	};

	async function createBookmark(bookmark: any) {
		creatingBookmark.value = true;

		try {
			const newBookmark = await saveCurrentAsBookmark({
				bookmark: bookmark.name,
				icon: bookmark.icon,
				color: bookmark.color,
			});

			router.push(`${getCollectionRoute(newBookmark.collection)}?bookmark=${newBookmark.id}`);

			bookmarkDialogActive.value = false;
		} catch (error) {
			unexpectedError(error);
		} finally {
			creatingBookmark.value = false;
		}
	}
}

function clearFilters() {
	filter.value = null;
	search.value = null;
}
</script>

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
		<ContentNotFound v-if="!currentCollection || isSystemCollection(collection)" />

		<PrivateView v-else :title="headerTitle" :icon="headerIcon" :icon-color="headerIconColor">
			<template #title-outer:append>
				<VMenu v-if="isVersioned" show-arrow placement="bottom" :disabled="!readVersionsAllowed">
					<template #activator="{ toggle }">
						<VersionChip
							:version="version ? { key: version, name: null } : null"
							:clickable="readVersionsAllowed"
							@click="toggle()"
						/>
					</template>

					<VList>
						<VListItem clickable :active="version === null" @click="versionKeyQuery = null">
							<VListItemContent>{{ $t('published') }}</VListItemContent>
						</VListItem>
						<VListItem clickable :active="version === VERSION_KEY_DRAFT" @click="versionKeyQuery = VERSION_KEY_DRAFT">
							<VListItemContent>{{ $t('draft') }}</VListItemContent>
						</VListItem>
					</VList>
				</VMenu>
			</template>

			<template #actions:prepend>
				<component :is="`layout-actions-${layout || 'tabular'}`" v-bind="layoutState" />
			</template>

			<template #actions>
				<SearchInput v-model="search" v-model:filter="filter" :collection="collection" />

				<PrivateViewHeaderBarActionButton
					v-if="isBookmarkResetable"
					:tooltip="$t('reset_bookmark')"
					icon="settings_backup_restore"
					variant="ghost"
					kind="danger"
					@click="clearLocalSave"
				/>

				<PrivateViewHeaderBarActionButton
					v-if="isBookmarkUpdateable"
					:tooltip="$t('update_bookmark')"
					icon="bookmark_save"
					variant="ghost"
					@click="savePreset()"
				/>

				<BookmarkDelete
					v-if="bookmark"
					v-model="deleteActive"
					:bookmark="bookmarkPreset"
					:saving="deleteSaving"
					@delete="deleteSave(bookmarkPreset)"
				>
					<template #activator="{ on }">
						<PrivateViewHeaderBarActionButton
							:tooltip="
								hasBookmarkPermission
									? $t(`delete_${bookmarkScope}_bookmark`)
									: $t(`cannot_edit_${bookmarkScope}_bookmarks`)
							"
							:disabled="!hasBookmarkPermission"
							icon="bookmark"
							icon-filled
							variant="ghost"
							kind="warning"
							active
							@click="on"
						/>
					</template>
				</BookmarkDelete>

				<BookmarkAdd v-else v-model="bookmarkDialogActive" :saving="creatingBookmark" @save="createBookmark">
					<template #activator="{ on }">
						<PrivateViewHeaderBarActionButton
							:tooltip="$t('create_bookmark')"
							icon="bookmark"
							variant="ghost"
							kind="warning"
							@click="on"
						/>
					</template>
				</BookmarkAdd>

				<VDialog v-if="selection.length > 0" v-model="confirmDelete" @esc="confirmDelete = false" @apply="batchDelete">
					<template #activator="{ on }">
						<PrivateViewHeaderBarActionButton
							v-tooltip.bottom="batchDeleteAllowed ? $t('delete_label') : $t('not_allowed')"
							:disabled="batchDeleteAllowed !== true"
							icon="delete"
							kind="danger"
							variant="ghost"
							@click="on"
						/>
					</template>

					<VCard>
						<VCardTitle>{{ $t('batch_delete_confirm', selection.length) }}</VCardTitle>

						<VCardActions>
							<VButton secondary @click="confirmDelete = false">
								{{ $t('cancel') }}
							</VButton>
							<VButton kind="danger" :loading="deleting" @click="batchDelete">
								{{ $t('delete_label') }}
							</VButton>
						</VCardActions>
					</VCard>
				</VDialog>

				<VDialog
					v-if="
						selection.length > 0 &&
						currentCollection.meta &&
						currentCollection.meta.archive_field &&
						archive !== 'archived' &&
						!isVersion
					"
					v-model="confirmArchive"
					@esc="confirmArchive = false"
					@apply="archiveItems"
				>
					<template #activator="{ on }">
						<PrivateViewHeaderBarActionButton
							v-tooltip.bottom="batchArchiveAllowed ? $t('archive') : $t('not_allowed')"
							:disabled="batchArchiveAllowed !== true"
							icon="archive"
							variant="ghost"
							@click="on"
						/>
					</template>

					<VCard>
						<VCardTitle>{{ $t('archive_confirm_count', selection.length) }}</VCardTitle>

						<VCardActions>
							<VButton secondary @click="confirmArchive = false">
								{{ $t('cancel') }}
							</VButton>
							<VButton kind="warning" :loading="archiving" @click="archiveItems">
								{{ $t('archive') }}
							</VButton>
						</VCardActions>
					</VCard>
				</VDialog>

				<PrivateViewHeaderBarActionButton
					v-if="selection.length > 0 && !isVersion"
					v-tooltip.bottom="batchEditAllowed ? $t('edit') : $t('not_allowed')"
					variant="ghost"
					:disabled="batchEditAllowed === false"
					icon="edit"
					@click="batchEditActive = true"
				/>
			</template>

			<template #actions:primary>
				<PrivateViewHeaderBarActionButton
					:tooltip="createNewAllowed ? translateShortcut(['meta', 'alt', 'n']) : $t('not_allowed')"
					:label="$t('create')"
					icon="add"
					:to="addNewLink"
					:disabled="createNewAllowed === false"
				/>
			</template>

			<template #navigation>
				<ContentNavigation :current-collection="collection" />
			</template>

			<VInfo
				v-if="bookmark && bookmarkExists === false"
				type="warning"
				:title="$t('bookmark_doesnt_exist')"
				icon="bookmark"
				center
			>
				{{ $t('bookmark_doesnt_exist_copy') }}

				<template #append>
					<VButton :to="currentCollectionLink">
						{{ $t('bookmark_doesnt_exist_cta') }}
					</VButton>
				</template>
			</VInfo>

			<component :is="`layout-${layout || 'tabular'}`" v-else v-bind="layoutState">
				<template #no-results>
					<VInfo :title="$t('no_results')" icon="search" center>
						{{ $t('no_results_copy') }}

						<template #append>
							<VButton @click="clearFilters">{{ $t('clear_filters') }}</VButton>
						</template>
					</VInfo>
				</template>

				<template #no-items>
					<VInfo
						:title="isVersion ? $t('no_versions', { version: versionName }) : $t('item_count', 0)"
						:icon="currentCollection.icon"
						center
					>
						{{ isVersion ? $t('no_versions_copy', { version: versionName }) : $t('no_items_copy') }}

						<template v-if="createAllowed" #append>
							<VButton :to="addNewLink">
								{{ $t('create_item') }}
							</VButton>
						</template>
					</VInfo>
				</template>

				<template #error="{ error, reset }">
					<VInfo type="danger" :title="$t('unexpected_error')" icon="error" center>
						{{ $t('unexpected_error_copy') }}

						<template #append>
							<VError :error="error" />

							<VButton small class="reset-preset" @click="reset">
								{{ $t('reset_page_preferences') }}
							</VButton>
						</template>
					</VInfo>
				</template>
			</component>

			<DrawerBatch
				v-model:active="batchEditActive"
				:primary-keys="selection"
				:collection="collection"
				@refresh="batchRefresh"
			/>

			<template #sidebar>
				<LayoutSidebarDetail v-model="layout">
					<component :is="`layout-options-${layout || 'tabular'}`" v-bind="layoutState" />
				</LayoutSidebarDetail>
				<component :is="`layout-sidebar-${layout || 'tabular'}`" v-bind="layoutState" />
				<ArchiveSidebarDetail v-if="hasArchive && !isVersion" :collection="collection" :archive="archive" />
				<RefreshSidebarDetail v-model="refreshInterval" @refresh="refresh" />
				<ExportSidebarDetail
					v-if="!isVersion"
					:collection="collection"
					:filter="mergeFilters(filter, archiveFilter)"
					:search="search"
					:layout-query="layoutQuery"
					:on-download="downloadHandler"
					@refresh="refresh"
				/>
				<FlowSidebarDetail v-if="!isVersion" :manual-flows />
			</template>

			<VDialog :model-value="deleteError !== null" @esc="deleteError = null">
				<VCard>
					<VCardTitle>{{ $t('something_went_wrong') }}</VCardTitle>
					<VCardText>
						<VError :error="deleteError" />
					</VCardText>
					<VCardActions>
						<VButton @click="deleteError = null">{{ $t('done') }}</VButton>
					</VCardActions>
				</VCard>
			</VDialog>

			<FlowDialogs v-bind="flowDialogsContext" />
		</PrivateView>
	</component>
</template>

<style lang="scss" scoped>
.header-icon {
	--v-button-color-disabled: var(--theme--foreground);
}

.reset-preset {
	margin-block-start: 1.375rem;
}

.saved-bookmark {
	display: flex;
	align-items: center;
	justify-content: center;
	block-size: 2rem;
	inline-size: 2rem;
	min-inline-size: 2rem;
}
</style>
