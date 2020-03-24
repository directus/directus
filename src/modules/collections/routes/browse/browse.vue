<template>
	<private-view v-if="currentCollection" :title="currentCollection.name">
		<template #title-outer:prepend>
			<v-button rounded disabled icon secondary>
				<v-icon :name="currentCollection.icon" />
			</v-button>
		</template>

		<template #headline>
			<v-breadcrumb :items="breadcrumb" />
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

		<layout-tabular
			class="layout"
			ref="layout"
			:collection="collection"
			:selection.sync="selection"
		/>
	</private-view>
	<!-- @TODO: Render real 404 view here -->
	<p v-else>Not found</p>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, toRefs } from '@vue/composition-api';
import { NavigationGuard } from 'vue-router';
import CollectionsNavigation from '../../components/navigation/';
import useCollectionsStore from '@/stores/collections';
import useFieldsStore from '@/stores/fields';
import useProjectsStore from '@/stores/projects';
import { i18n } from '@/lang';
import api from '@/api';
import { LayoutComponent } from '@/layouts/types';

const redirectIfNeeded: NavigationGuard = async (to, from, next) => {
	const collectionsStore = useCollectionsStore();
	const collectionInfo = collectionsStore.getCollection(to.params.collection);

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
	components: { CollectionsNavigation },
	props: {
		collection: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const layout = ref<LayoutComponent>(null);
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();
		const projectsStore = useProjectsStore();

		const { currentProjectKey } = toRefs(projectsStore.state);

		const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(props.collection);

		const selection = ref<Item[]>([]);

		// Whenever the collection changes we're working on, we have to clear the selection
		watch(
			() => props.collection,
			() => (selection.value = [])
		);

		const breadcrumb = [
			{
				name: i18n.tc('collection', 2),
				to: `/${currentProjectKey.value}/collections`,
			},
		];

		const currentCollection = computed(() => collectionsStore.getCollection(props.collection));

		const addNewLink = computed<string>(
			() => `/${currentProjectKey}/collections/${props.collection}/+`
		);

		const batchLink = computed<string>(() => {
			const batchPrimaryKeys = selection.value
				.map((item) => item[primaryKeyField.field])
				.join();
			return `/${currentProjectKey}/collections/${props.collection}/${batchPrimaryKeys}`;
		});

		const confirmDelete = ref(false);
		const deleting = ref(false);

		return {
			currentCollection,
			addNewLink,
			batchLink,
			selection,
			breadcrumb,
			confirmDelete,
			batchDelete,
			deleting,
			layout,
		};

		async function batchDelete() {
			deleting.value = true;

			confirmDelete.value = false;

			const batchPrimaryKeys = selection.value
				.map((item) => item[primaryKeyField.field])
				.join();

			await api.delete(`/${currentProjectKey}/items/${props.collection}/${batchPrimaryKeys}`);

			await layout.value?.refresh();

			selection.value = [];
			deleting.value = false;
			confirmDelete.value = false;
		}
	},
});
</script>

<style lang="scss" scoped>
.private-view {
	--private-view-content-padding: 0 !important;
}

.action-delete {
	--v-button-background-color: var(--danger);
	--v-button-background-color-hover: var(--danger-dark);
}

.action-batch {
	--v-button-background-color: var(--warning);
	--v-button-background-color-hover: var(--warning-dark);
}

.layout {
	--layout-offset-top: 64px;
}
</style>
