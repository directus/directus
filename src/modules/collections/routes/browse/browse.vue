<template>
	<collections-not-found v-if="!currentCollection || collection.startsWith('directus_')" />
	<private-view v-else :title="currentCollection.name">
		<template #title-outer:prepend>
			<v-button rounded icon secondary :to="collectionsLink">
				<v-icon :name="currentCollection.icon" />
			</v-button>
		</template>

		<template #drawer>
			<layout-drawer-detail v-model="viewType" />
			<filter-drawer-detail v-model="filters" :collection="collection" />
			<portal-target name="drawer" />
		</template>

		<template #actions>
			<v-dialog v-model="confirmDelete">
				<template #activator="{ on }">
					<v-button
						rounded
						icon
						class="action-delete"
						v-if="selection.length > 0"
						@click="on"
					>
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
			<collections-navigation />
		</template>

		<component
			class="layout"
			ref="layout"
			:is="`layout-${viewType}`"
			:collection="collection"
			:selection.sync="selection"
			:view-options.sync="viewOptions"
			:view-query.sync="viewQuery"
			:filters.sync="filters"
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
import useCollection from '@/compositions/use-collection';
import useCollectionPreset from '@/compositions/use-collection-preset';
import FilterDrawerDetail from '@/views/private/components/filter-drawer-detail';
import LayoutDrawerDetail from '@/views/private/components/layout-drawer-detail';

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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[field: string]: any;
};

export default defineComponent({
	beforeRouteEnter: redirectIfNeeded,
	beforeRouteUpdate: redirectIfNeeded,
	name: 'collections-browse',
	components: {
		CollectionsNavigation,
		CollectionsNotFound,
		FilterDrawerDetail,
		LayoutDrawerDetail,
	},
	props: {
		collection: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const layout = ref<LayoutComponent>(null);

		const { collection } = toRefs(props);

		const projectsStore = useProjectsStore();

		const { selection } = useSelection();
		const { info: currentCollection, primaryKeyField } = useCollection(collection);
		const { addNewLink, batchLink, collectionsLink } = useLinks();
		const { viewType, viewOptions, viewQuery, filters } = useCollectionPreset(collection);
		const { confirmDelete, deleting, batchDelete } = useBatchDelete();

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
		};

		function useSelection() {
			const selection = ref<Item[]>([]);

			// Whenever the collection changes we're working on, we have to clear the selection
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

				const batchPrimaryKeys = selection.value
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					.map((item) => item[primaryKeyField.value!.field])
					.join();

				await api.delete(
					`/${currentProjectKey}/items/${props.collection}/${batchPrimaryKeys}`
				);

				await layout.value?.refresh();

				selection.value = [];
				deleting.value = false;
				confirmDelete.value = false;
			}
		}

		function useLinks() {
			const addNewLink = computed<string>(() => {
				const currentProjectKey = projectsStore.state.currentProjectKey;
				return `/${currentProjectKey}/collections/${props.collection}/+`;
			});

			const batchLink = computed<string>(() => {
				const currentProjectKey = projectsStore.state.currentProjectKey;
				const batchPrimaryKeys = selection.value
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					.map((item) => item[primaryKeyField.value!.field])
					.join();
				return `/${currentProjectKey}/collections/${props.collection}/${batchPrimaryKeys}`;
			});

			const collectionsLink = computed<string>(() => {
				const currentProjectKey = projectsStore.state.currentProjectKey;

				return `/${currentProjectKey}/collections`;
			});

			return { addNewLink, batchLink, collectionsLink };
		}
	},
});
</script>

<style lang="scss" scoped>
.action-delete {
	--v-button-background-color: var(--danger);
	--v-button-background-color-hover: var(--danger-dark);
}

.action-batch {
	--v-button-background-color: var(--warning);
	--v-button-background-color-hover: var(--warning-150);
}

.layout {
	--layout-offset-top: 64px;
}
</style>
