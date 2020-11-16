<template>
	<div class="m2a-builder">
		<v-menu attached>
			<template #activator="{ toggle }">
				<v-button dashed outlined full-width @click="toggle">
					{{ $t('add_existing') }}
				</v-button>
			</template>

			<v-list>
				<v-list-item v-for="collection of collections" :key="collection.collection">
					<v-list-item-icon><v-icon :name="collection.icon" /></v-list-item-icon>
					<v-list-item-text>{{ $t('from_collection', { collection: collection.name }) }}</v-list-item-text>
				</v-list-item>
			</v-list>
		</v-menu>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';
import { useRelationsStore, useCollectionsStore } from '../../stores';
import { Relation, Collection } from '../../types/';

export default defineComponent({
	props: {
		collection: {
			type: String,
			required: true,
		},
		field: {
			type: String,
			required: true,
		},
		value: {
			type: Array as PropType<any[]>,
			default: null,
		},
	},
	setup(props) {
		const relationsStore = useRelationsStore();
		const collectionsStore = useCollectionsStore();

		const { o2mRelation, anyRelation } = useRelations();
		const { collections } = useCollections();

		return { collections };

		function useRelations() {
			const relationsForField = computed<Relation[]>(() => {
				return relationsStore.getRelationsForField(props.collection, props.field);
			});

			const o2mRelation = computed(
				() => relationsForField.value.find((relation) => relation.one_collection !== null)!
			);
			const anyRelation = computed(
				() => relationsForField.value.find((relation) => relation.one_collection === null)!
			);

			return { relationsForField, o2mRelation, anyRelation };
		}

		function useCollections() {
			const allowedCollections = computed(() => anyRelation.value.one_allowed_collections!);

			const collections = computed<Collection[]>(
				() =>
					allowedCollections.value
						.map((collection: string) => collectionsStore.getCollection(collection))
						.filter((c) => c) as Collection[]
			);

			return { collections };
		}
	},
});
</script>

<style lang="scss" scoped>
.m2a-builder {
	background-color: red;
}
</style>
