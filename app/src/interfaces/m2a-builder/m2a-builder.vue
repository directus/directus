<template>
	<div class="m2a-builder">
		<div class="m2a-row" v-for="(item, index) of previewValues" :key="index" @click="editExisting(item)">
			<span class="collection">{{ collections[item[anyRelation.one_collection_field]].name }}:</span>
			<render-template
				:collection="item[anyRelation.one_collection_field]"
				:template="templates[item[anyRelation.one_collection_field]]"
				:item="item[anyRelation.many_field]"
			/>
			<div class="spacer" />
			<v-icon class="launch-icon" name="launch" />
		</div>

		<div class="buttons">
			<v-menu attached>
				<template #activator="{ toggle }">
					<v-button dashed outlined full-width @click="toggle">
						{{ $t('create_new') }}
					</v-button>
				</template>

				<v-list>
					<v-list-item
						@click="createNew(collection.collection)"
						v-for="collection of collections"
						:key="collection.collection"
					>
						<v-list-item-icon><v-icon :name="collection.icon" /></v-list-item-icon>
						<v-list-item-text>
							{{ $t('from_collection', { collection: collection.name }) }}
						</v-list-item-text>
					</v-list-item>
				</v-list>
			</v-menu>

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
						<v-list-item-text>
							{{ $t('from_collection', { collection: collection.name }) }}
						</v-list-item-text>
					</v-list-item>
				</v-list>
			</v-menu>
		</div>

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

		<drawer-item
			v-if="!disabled"
			:active="!!currentlyEditing"
			:collection="o2mRelation.many_collection"
			:primary-key="currentlyEditing || '+'"
			:related-primary-key="relatedPrimaryKey || '+'"
			:junction-field="o2mRelation.junction_field"
			:edits="itemAtStart"
			@input="stageEdits"
			@update:active="cancelEdit"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, ref, watch } from '@vue/composition-api';
import { useRelationsStore, useCollectionsStore, useFieldsStore } from '../../stores';
import { Relation, Collection } from '../../types/';
import DrawerCollection from '../../views/private/components/drawer-collection/';
import DrawerItem from '../../views/private/components/drawer-item/';
import api from '../../api';
import { unexpectedError } from '../../utils/unexpected-error';
import { getFieldsFromTemplate } from '../../utils/get-fields-from-template';

export default defineComponent({
	components: { DrawerCollection, DrawerItem },
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
		const fieldsStore = useFieldsStore();
		const collectionsStore = useCollectionsStore();

		const { o2mRelation, anyRelation } = useRelations();
		const { collections, templates } = useCollections();
		const { previewValues, fetchValues } = useValues();
		const { selectingFrom, stageSelection } = useSelection();
		const { currentlyEditing, relatedPrimaryKey, itemAtStart, stageEdits, cancelEdit, editExisting, createNew } = useEdits();

		watch(props, fetchValues, { immediate: true });

		return { collections, selectingFrom, stageSelection, previewValues, templates, o2mRelation, anyRelation, currentlyEditing, relatedPrimaryKey, itemAtStart, stageEdits, cancelEdit, editExisting, createNew };

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

			const collections = computed<Record<string, Collection>>(() => {
				const collections: Record<string, Collection> = {};

				const collectionInfo = allowedCollections.value
					.map((collection: string) => collectionsStore.getCollection(collection))
					.filter((c) => c) as Collection[];

				for (const collection of collectionInfo) {
					collections[collection.collection] = collection;
				}

				return collections;
			});

			const templates = computed(() => {
				const templates: Record<string, string> = {};

				for (const collection of Object.values(collections.value)) {
					const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(collection.collection);
					templates[collection.collection] =
						collection.meta?.display_template || `{{${primaryKeyField.field}}}`;
				}

				return templates;
			});

			return { collections, templates };
		}

		function useValues() {
			const loading = ref(false);
			const previewValues = ref<any[]>([]);

			return { previewValues, fetchValues };

			async function fetchValues() {
				loading.value = true;

				const fields: string[] = [o2mRelation.value.many_primary, anyRelation.value.one_collection_field!];

				for (const collection of Object.values(collections.value)) {
					const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(collection.collection);
					const fieldsInCollection = getFieldsFromTemplate(templates.value[collection.collection]);

					fields.push(
						...fieldsInCollection.map(
							(field: string) => `${anyRelation.value.many_field}:${collection.collection}.${field}`
						)
					);
				}

				/**
				 * @TODO
				 *
				 * Fetch the items based on the original collections, instead of trying to read everything through
				 * the junction table. When adding new items or selecting existing, this 👇 will fail.
				 * We should extract all related items from props.value, and fetch them based on the related keys instead
				 *
				 * After that, the rows themselves can loop over props.value instead of previewValues, allowing us to
				 * do the edits on the actual value instead of the preview.
				 */

				try {
					const response = await api.get(`/items/${o2mRelation.value.many_collection}`, {
						params: {
							filter: {
								[o2mRelation.value.many_field]: props.primaryKey,
							},
							fields,
						},
					});

					previewValues.value = response.data.data;
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
						[one_collection_field!]: selectingFrom.value,
						[many_field]: key,
					};
				});

				emit('input', [...currentValue, ...selectionAsJunctionRows]);
			}
		}

		function useEdits() {
			const currentlyEditing = ref<string | number | null>(null);
			const relatedPrimaryKey = ref<string | number | null>(null);
			const itemAtStart = ref<Record<string, any>>({});

			return { currentlyEditing, relatedPrimaryKey, itemAtStart, stageEdits, cancelEdit, editExisting, createNew };

			function stageEdits(edits: Record<string, any>) {

			}

			function cancelEdit() {
				currentlyEditing.value = null;
				relatedPrimaryKey.value = null;
				itemAtStart.value = {};
			}

			function editExisting(item: Record<string, any>) {

			}

			function createNew(collection: string) {
				const currentValue = props.value || [];

				const newItem = {
					[anyRelation.value.one_collection_field!]: collection,
				};

				emit('input', [...currentValue, newItem]);

				itemAtStart.value = newItem;
				relatedPrimaryKey.value = '+';
				currentlyEditing.value = '+';
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.m2a-builder {
	background-color: white;
}

.m2a-row {
	display: flex;
	align-items: center;
	padding: 12px;
	background-color: var(--background-subdued);
	border: 2px solid var(--border-subdued);
	border-radius: var(--border-radius);

	& + .m2a-row {
		margin-top: 12px;
	}

	.collection {
		margin-right: 1ch;
		color: var(--primary);
	}
}

.buttons {
	margin-top: 12px;
	display: grid;
	grid-template-columns: 1fr 1fr;
	grid-gap: 12px;
}

.spacer {
	flex-grow: 1;
}

.launch-icon {
	color: var(--foreground-subdued);
}
</style>
