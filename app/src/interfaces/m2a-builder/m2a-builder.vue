<template>
	<div class="m2a-builder">
		{{ value }}

		<v-menu attached>
			<template #activator="{ toggle }">
				<v-button dashed outlined full-width @click="toggle">
					{{ $t('add_existing') }}
				</v-button>
			</template>

			<v-list>
				<v-list-item
					@click="selectingFrom = collection.collection"
					v-for="collection of collections"
					:key="collection.collection"
				>
					<v-list-item-icon><v-icon :name="collection.icon" /></v-list-item-icon>
					<v-list-item-text>{{ $t('from_collection', { collection: collection.name }) }}</v-list-item-text>
				</v-list-item>
			</v-list>
		</v-menu>

		<drawer-collection
			multiple
			v-if="!disabled && !!selectingFrom"
			:active="!!selectingFrom"
			:collection="selectingFrom"
			:selection="[]"
			@input="stageSelection"
			@update:active="selectingFrom = null"
		/>
		<!-- :filters="selectionFilters" -->
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, ref, watch } from '@vue/composition-api';
import { useRelationsStore, useCollectionsStore } from '../../stores';
import { Relation, Collection } from '../../types/';
import DrawerCollection from '../../views/private/components/drawer-collection/';
import api from '../../api';
import { unexpectedError } from '../../utils/unexpected-error';

export default defineComponent({
	components: { DrawerCollection },
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
		disabled: {
			type: Boolean,
			default: false,
		},
		primaryKey: {
			type: [String, Number] as PropType<string | number>,
			required: true,
		},
	},
	setup(props, { emit }) {
		const relationsStore = useRelationsStore();
		const collectionsStore = useCollectionsStore();

		const { o2mRelation, anyRelation } = useRelations();
		const { collections } = useCollections();
		const { values, fetchValues } = useValues();
		const { selectingFrom, stageSelection } = useSelection();

		watch(props, fetchValues, { immediate: true });

		return { collections, selectingFrom, stageSelection };

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

		function useValues() {
			const loading = ref(false);
			const values = ref<any[]>([]);

			return { values, fetchValues };

			async function fetchValues() {
				loading.value = true;

				try {
					const response = await api.get(`/items/${o2mRelation.value.many_collection}`, {
						params: {
							filter: {
								[o2mRelation.value.many_field]: props.primaryKey,
							},
						},
					});

					console.log(response.data.data);
				} catch (err) {
					unexpectedError(err);
				} finally {
					loading.value = false;
				}
			}
		}

		function useSelection() {
			const selectingFrom = ref<string | null>(null);

			return { selectingFrom, stageSelection };

			function stageSelection(selection: (number | string)[]) {
				const { one_collection_field, many_field } = anyRelation.value;

				const currentValue = props.value || [];

				const selectionAsJunctionRows = selection.map((key) => {
					return {
						[one_collection_field]: selectingFrom.value,
						[many_field]: key,
					};
				});

				emit('input', [...currentValue, ...selectionAsJunctionRows]);
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.m2a-builder {
	background-color: white;
}
</style>
