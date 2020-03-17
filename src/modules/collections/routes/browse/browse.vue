<template>
	<private-view v-if="currentCollection" :title="currentCollection.name">
		<template #actions>
			<v-button rounded icon style="--v-button-background-color: var(--success);">
				<v-icon name="add" />
			</v-button>
			<v-button rounded icon style="--v-button-background-color: var(--warning);">
				<v-icon name="delete" />
			</v-button>
			<v-button rounded icon style="--v-button-background-color: var(--danger);">
				<v-icon name="favorite" />
			</v-button>
		</template>

		<template #navigation>
			<collections-navigation />
		</template>

		<layout-tabular :collection="collection" />
	</private-view>
	<!-- @TODO: Render real 404 view here -->
	<p v-else>Not found</p>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import useCollectionsStore from '@/stores/collections';
import { Collection } from '@/stores/collections/types';
import CollectionsNavigation from '../../components/navigation/';

export default defineComponent({
	name: 'collections-browse',
	components: { CollectionsNavigation },
	props: {
		collection: {
			type: String,
			required: true
		}
	},
	setup(props) {
		const collectionsStore = useCollectionsStore();
		const currentCollection = computed<Collection | null>(() => {
			return (
				collectionsStore.state.collections.find(
					collection => collection.collection === props.collection
				) || null
			);
		});
		return { currentCollection };
	}
});
</script>
