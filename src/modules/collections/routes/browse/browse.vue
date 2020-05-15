<template>
	<collections-not-found v-if="!currentCollection || collection.startsWith('directus_')" />
	<private-view v-else :title="bookmark ? bookmarkName : currentCollection.name">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon secondary :to="collectionsLink">
				<v-icon :name="currentCollection.icon" />
			</v-button>
		</template>

		<template v-if="bookmark" #headline>
			<v-breadcrumb :items="breadcrumb" />
		</template>

		<template #title-outer:append>
			<bookmark-add
				v-if="!bookmark"
				class="bookmark-add"
				v-model="bookmarkDialogActive"
				@save="createBookmark"
				:saving="creatingBookmark"
			>
				<template #activator="{ on }">
					<v-icon class="toggle" name="bookmark_outline" @click="on" />
				</template>
			</bookmark-add>

			<bookmark-edit
				v-else
				class="bookmark-edit"
				v-model="bookmarkDialogActive"
				:saving="editingBookmark"
				:name="bookmarkName"
				@save="editBookmark"
			>
				<template #activator="{ on }">
					<v-icon class="toggle" name="bookmark" @click="on" />
				</template>
			</bookmark-edit>
		</template>

		<template #drawer>
			<layout-drawer-detail @input="viewType = $event" :value="viewType" />
			<portal-target name="drawer" />
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

			<v-button rounded icon :to="addNewLink">
				<v-icon name="add" />
			</v-button>
		</template>

		<template #navigation>
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
			ref="layout"
			:is="`layout-${viewType || 'tabular'}`"
			:collection="collection"
			:selection.sync="selection"
			:view-options.sync="viewOptions"
			:view-query.sync="viewQuery"
			:filters.sync="filters"
			:search-query.sync="searchQuery"
		/>
	</private-view>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, toRefs } from '@vue/composition-api';
import { NavigationGuard } from 'vue-router';
import CollectionsNavigation from '../../components/navigation/';
import useCollectionsStore from '@/stores/collections';
import useFieldsStore from '@/stores/fields';
import useProjectsStore from '@/stores/projects';
import api from '@/api';
import { LayoutComponent } from '@/layouts/types';
import CollectionsNotFound from '../not-found/';
import useCollection from '@/composables/use-collection';
import useCollectionPreset from '@/composables/use-collection-preset';
import LayoutDrawerDetail from '@/views/private/components/layout-drawer-detail';
import SearchInput from '@/views/private/components/search-input';
import BookmarkAdd from '@/views/private/components/bookmark-add';
import BookmarkEdit from '@/views/private/components/bookmark-edit';
import router from '@/router';

const redirectIfNeeded: NavigationGuard = async (to, from, next) => {
	const collectionsStore = useCollectionsStore();
	const collectionInfo = collectionsStore.getCollection(to.params.collection);

	if (collectionInfo === null) return next();

	if (collectionInfo.single === true) {
		const fieldsStore = useFieldsStore();

		const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(to.params.collection);

		const item = await api.get(`/${to.params.project}/items/${to.params.collection}`, {
			params: {
				limit: 1,
				fields: primaryKeyField.field,
				single: true,
			},
		});

		const primaryKey = item.data.data[primaryKeyField.field];

		return next(`/${to.params.project}/collections/${to.params.collection}/${primaryKey}`);
	}

	return next();
};

type Item = {
	[field: string]: any;
};

export default defineComponent({
	beforeRouteEnter: redirectIfNeeded,
	beforeRouteUpdate: redirectIfNeeded,
	name: 'collections-browse',
	components: {
		CollectionsNavigation,
		CollectionsNotFound,
		LayoutDrawerDetail,
		SearchInput,
		BookmarkAdd,
		BookmarkEdit,
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
		const layout = ref<LayoutComponent>(null);

		const { collection } = toRefs(props);
		const bookmarkID = computed(() => (props.bookmark ? +props.bookmark : null));

		const projectsStore = useProjectsStore();

		const { selection } = useSelection();
		const { info: currentCollection } = useCollection(collection);
		const { addNewLink, batchLink, collectionsLink, currentCollectionLink } = useLinks();
		const { breadcrumb } = useBreadcrumb();
		const {
			viewType,
			viewOptions,
			viewQuery,
			filters,
			searchQuery,
			savePreset,
			bookmarkExists,
			saveCurrentAsBookmark,
			title: bookmarkName,
		} = useCollectionPreset(collection, bookmarkID);
		const { confirmDelete, deleting, batchDelete } = useBatchDelete();

		const {
			bookmarkDialogActive,
			creatingBookmark,
			createBookmark,
			editingBookmark,
			editBookmark,
		} = useBookmarks();

		watch(collection, () => {
			if (viewType.value === null) {
				viewType.value = 'tabular';
			}
		});

		return {
			addNewLink,
			batchDelete,
			batchLink,
			collectionsLink,
			confirmDelete,
			currentCollection,
			deleting,
			filters,
			layout,
			selection,
			viewOptions,
			viewQuery,
			viewType,
			searchQuery,
			savePreset,
			bookmarkExists,
			currentCollectionLink,
			bookmarkDialogActive,
			creatingBookmark,
			createBookmark,
			bookmarkName,
			editingBookmark,
			editBookmark,
			breadcrumb,
		};

		function useBreadcrumb() {
			const breadcrumb = computed(() => [
				{
					name: currentCollection.value?.name,
					to: `/${projectsStore.state.currentProjectKey}/collections/${props.collection}`,
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

		function useBatchDelete() {
			const confirmDelete = ref(false);
			const deleting = ref(false);

			return { confirmDelete, deleting, batchDelete };

			async function batchDelete() {
				const currentProjectKey = projectsStore.state.currentProjectKey;

				deleting.value = true;

				confirmDelete.value = false;

				const batchPrimaryKeys = selection.value;

				try {
					await api.delete(
						`/${currentProjectKey}/items/${props.collection}/${batchPrimaryKeys}`
					);

					await layout.value?.refresh?.();

					selection.value = [];
					confirmDelete.value = false;
				} catch (err) {
					console.error(err);
				} finally {
					deleting.value = false;
				}
			}
		}

		function useLinks() {
			const addNewLink = computed<string>(() => {
				const currentProjectKey = projectsStore.state.currentProjectKey;
				return `/${currentProjectKey}/collections/${props.collection}/+`;
			});

			const batchLink = computed<string>(() => {
				const currentProjectKey = projectsStore.state.currentProjectKey;
				const batchPrimaryKeys = selection.value.join();
				return `/${currentProjectKey}/collections/${props.collection}/${batchPrimaryKeys}`;
			});

			const collectionsLink = computed<string>(() => {
				const currentProjectKey = projectsStore.state.currentProjectKey;

				return `/${currentProjectKey}/collections`;
			});

			const currentCollectionLink = computed<string>(() => {
				const currentProjectKey = projectsStore.state.currentProjectKey;

				return `/${currentProjectKey}/collections/${props.collection}`;
			});

			return { addNewLink, batchLink, collectionsLink, currentCollectionLink };
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
				const { currentProjectKey } = projectsStore.state;

				creatingBookmark.value = true;

				try {
					const newBookmark = await saveCurrentAsBookmark({ title: name });
					router.push(
						`/${currentProjectKey}/collections/${newBookmark.collection}?bookmark=${newBookmark.id}`
					);

					bookmarkDialogActive.value = false;
				} catch (error) {
					console.log(error);
				} finally {
					creatingBookmark.value = false;
				}
			}

			async function editBookmark(name: string) {
				bookmarkName.value = name;
				bookmarkDialogActive.value = false;
			}
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

.header-icon.secondary {
	--v-button-background-color: var(--background-normal);
	--v-button-background-color-activated: var(--background-normal);
	--v-button-background-color-hover: var(--background-normal-alt);
}

.layout {
	--layout-offset-top: 64px;
}

.bookmark-add .toggle,
.bookmark-edit .toggle {
	margin-left: 8px;
	transition: color var(--fast) var(--transition);
}

.bookmark-add {
	color: var(--foreground-subdued);

	&:hover {
		color: var(--foreground-normal);
	}
}

.bookmark-edit {
	color: var(--primary);
}
</style>
