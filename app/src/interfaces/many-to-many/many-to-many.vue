<template>
	<v-notice type="warning" v-if="!junction || !relation">
		{{ $t('relationship_not_setup') }}
	</v-notice>
	<div class="one-to-many" v-else>
		<v-table
			:loading="loading"
			:items="displayItems"
			:headers.sync="tableHeaders"
			show-resize
			inline
			@click:row="editItem"
			:disabled="disabled"
		>
			<template v-for="header in tableHeaders" v-slot:[`item.${header.value}`]="{ item }">
				<render-display
					:key="header.value"
					:value="item[header.value]"
					:display="header.field.display"
					:options="header.field.displayOptions"
					:interface="header.field.interface"
					:interface-options="header.field.interfaceOptions"
					:type="header.field.type"
					:collection="junctionCollection.collection"
					:field="header.field.field"
				/>
			</template>

			<template #item-append="{ item }" v-if="!disabled">
				<v-icon name="close" v-tooltip="$t('deselect')" class="deselect" @click.stop="deleteItem(item)" />
			</template>
		</v-table>

		<div class="actions" v-if="!disabled">
			<v-button class="new" @click="currentlyEditing = '+'">{{ $t('create_new') }}</v-button>
			<v-button class="existing" @click="selectModalActive = true">
				{{ $t('add_existing') }}
			</v-button>
		</div>

		<modal-detail
			v-if="!disabled"
			:active="currentlyEditing !== null"
			:collection="relationCollection.collection"
			:primary-key="currentlyEditing || '+'"
			:edits="editsAtStart"
			@input="stageEdits"
			@update:active="cancelEdit"
		/>

		<modal-browse
			v-if="!disabled"
			:active.sync="selectModalActive"
			:collection="relationCollection.collection"
			:selection="selectedPrimaryKeys"
			:filters="[]"
			@input="stageSelection"
			multiple
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, PropType, toRefs } from '@vue/composition-api';
import api from '@/api';
import useCollection from '@/composables/use-collection';
import { useCollectionsStore, useRelationsStore, useFieldsStore } from '@/stores/';
import ModalDetail from '@/views/private/components/modal-detail';
import ModalBrowse from '@/views/private/components/modal-browse';
import { Filter, Field } from '@/types';
import { Header } from '@/components/v-table/types';
import { Relation } from '@/types';
import { cloneDeep, isEqual } from 'lodash';

import useActions from './actions';

export default defineComponent({
	components: { ModalDetail, ModalBrowse },
	props: {
		value: {
			type: Array as PropType<(number | string | Record<string, any>)[]>,
			default: null,
		},
		primaryKey: {
			type: [Number, String],
			required: true,
		},
		collection: {
			type: String,
			required: true,
		},
		field: {
			type: String,
			required: true,
		},
		fields: {
			type: Array as PropType<string[]>,
			default: () => [],
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const { value } = toRefs(props);
		const relationsStore = useRelationsStore();
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		const { junction, junctionCollection, relation, relationCollection, relationFields } = useRelation();
		const { tableHeaders, items, loading, error, displayItems, getJunctionFromRelatedId } = useTable();
		const { currentlyEditing, editItem, editsAtStart, stageEdits, cancelEdit } = useEdits();
		const { stageSelection, selectModalActive, selectedPrimaryKeys } = useSelection();

		const {
			deleteItem,
			getUpdatedItems,
			getNewItems,
			getPrimaryKeys,
			getNewSelectedItems,
			getJunctionItem,
		} = useActions(value, items, relationFields, (newValue) => emit('input', newValue));

		return {
			junction,
			relation,
			tableHeaders,
			loading,
			currentlyEditing,
			editItem,
			junctionCollection,
			relationCollection,
			editsAtStart,
			stageEdits,
			cancelEdit,
			stageSelection,
			selectModalActive,
			deleteItem,
			displayItems,
			selectedPrimaryKeys,
			items,
		};

		/**
		 * Holds info about the current relationship, like related collection, primary key field
		 * of the other collection etc
		 */
		function useRelation() {
			const relations = computed(() => {
				return relationsStore.getRelationsForField(props.collection, props.field) as Relation[];
			});

			const junction = computed(() => {
				return relations.value.find((relation) => relation.one_collection === props.collection) as Relation;
			});

			const relation = computed(() => {
				return relations.value.find((relation) => relation.one_collection !== props.collection) as Relation;
			});

			const junctionCollection = computed(() => {
				return collectionsStore.getCollection(junction.value.many_collection)!;
			});

			const relationCollection = computed(() => {
				return collectionsStore.getCollection(relation.value.one_collection)!;
			});

			const { primaryKeyField: junctionPrimaryKeyField } = useCollection(junctionCollection.value.collection);
			const { primaryKeyField: relationPrimaryKeyField } = useCollection(relationCollection.value.collection);

			const relationFields = computed(() => {
				return {
					junctionPkField: junctionPrimaryKeyField.value.field,
					relationPkField: relationPrimaryKeyField.value.field,
					junctionRelation: junction.value.junction_field as string,
				};
			});

			return {
				junction,
				junctionCollection,
				relation,
				relationCollection,
				relationFields,
			};
		}

		function useTable() {
			// Using a ref for the table headers here means that the table itself can update the
			// values if it needs to. This allows the user to manually resize the columns for example
			const tableHeaders = ref<Header[]>([]);
			const loading = ref(false);
			const items = ref<Record<string, any>[]>([]);
			const error = ref(null);

			watch(
				() => props.value,
				async (newVal) => {
					loading.value = true;
					const { junctionRelation, relationPkField, junctionPkField } = relationFields.value;
					if (junctionRelation === null) return;

					// Load the junction items so we have access to the id's in the related collection
					const junctionItems = await loadRelatedIds(newVal);
					const relatedPrimaryKeys = junctionItems.map((junction) => junction[junctionRelation]);

					const fields = [...(props.fields.length > 0 ? props.fields : getDefaultFields())];

					if (fields.includes(relationPkField) === false) fields.push(relationPkField);

					try {
						const endpoint = relationCollection.value.collection.startsWith('directus_')
							? `/${relationCollection.value.collection.substring(9)}`
							: `/items/${relationCollection.value.collection}`;

						const response = await api.get(endpoint, {
							params: {
								fields: fields,
								[`filter[${relationPkField}][_in]`]: relatedPrimaryKeys.join(','),
							},
						});

						const responseData = (response.data.data as Record<string, any>[]) || [];

						// Insert the related items into the junction items
						const existingItems = responseData.map((data) => {
							const id = data[relationPkField];
							const junction = junctionItems.find((junction) => junction[junctionRelation] === id);
							if (junction === undefined) return;

							const newJunction = cloneDeep(junction);
							newJunction[junctionRelation] = data;
							return newJunction;
						}) as Record<string, any>[];

						const updatedItems = getUpdatedItems();
						const newItems = getNewItems();

						// Replace existing items with it's updated counterparts
						const newVal = existingItems
							.map((item) => {
								const updatedItem = updatedItems.find(
									(updated) => updated[junctionPkField] === item[junctionPkField]
								);
								if (updatedItem !== undefined) return updatedItem;
								return item;
							})
							.concat(...newItems);
						items.value = newVal;
					} catch (err) {
						error.value = err;
					} finally {
						loading.value = false;
					}
				},
				{ immediate: true }
			);

			async function loadRelatedIds(newVal: (string | number | Record<string, any>)[]) {
				const { junctionPkField } = relationFields.value;

				try {
					const endpoint = junctionCollection.value.collection.startsWith('directus_')
						? `/${junctionCollection.value.collection.substring(9)}`
						: `/items/${junctionCollection.value.collection}`;

					const response = await api.get(endpoint, {
						params: {
							[`filter[${junctionPkField}][_in]`]: getPrimaryKeys().join(','),
						},
					});
					const data = response.data.data as Record<string, any>[];

					// Add all items that already had the id of it's related item
					return data.concat(...getNewSelectedItems());
				} catch (err) {
					error.value = err;
				}
				return [];
			}

			function getJunctionFromRelatedId(id: string | number) {
				const { relationPkField, junctionRelation } = relationFields.value;

				return (
					items.value.find((item) => {
						return;
						typeof item === 'object' &&
							junctionRelation in item &&
							typeof item[junctionRelation] === 'object' &&
							relationPkField in item[junctionRelation] &&
							item[junctionRelation][relationPkField] === id;
					}) || null
				);
			}

			const displayItems = computed(() => {
				const { junctionRelation } = relationFields.value;
				return items.value.map((item) => item[junctionRelation]);
			});

			// Seeing we don't care about saving those tableHeaders, we can reset it whenever the
			// fields prop changes (most likely when we're navigating to a different o2m context)
			watch(
				() => props.fields,
				() => {
					tableHeaders.value = (props.fields.length > 0 ? props.fields : getDefaultFields())
						.map((fieldKey) => {
							const field = fieldsStore.getField(relationCollection.value.collection, fieldKey);

							if (!field) return null;

							const header: Header = {
								text: field.name,
								value: fieldKey,
								align: 'left',
								sortable: true,
								width: null,
								field: {
									display: field.meta?.display,
									displayOptions: field.meta?.display_options,
									interface: field.meta?.interface,
									interfaceOptions: field.meta?.options,
									type: field.type,
									field: field.field,
								},
							};

							return header;
						})
						.filter((h) => h) as Header[];
				},
				{ immediate: true }
			);

			return { tableHeaders, displayItems, items, loading, error, getJunctionFromRelatedId };
		}

		function useEdits() {
			// Primary key of the item we're currently editing. If null, the edit modal should be
			// closed
			const currentlyEditing = ref<string | number | null>(null);

			// This keeps track of the starting values so we can match with it
			const editsAtStart = ref<Record<string, any>>({});

			return { currentlyEditing, editItem, editsAtStart, stageEdits, cancelEdit };

			function editItem(item: any) {
				const { relationPkField } = relationFields.value;
				const hasPrimaryKey = relationPkField in item;

				editsAtStart.value = item;
				currentlyEditing.value = hasPrimaryKey ? item[relationPkField] : -1;
			}

			function stageEdits(edits: any) {
				const { relationPkField, junctionRelation, junctionPkField } = relationFields.value;
				const editsWrapped = { [junctionRelation]: edits };
				const hasPrimaryKey = relationPkField in editsAtStart.value;
				const junctionItem = hasPrimaryKey
					? getJunctionFromRelatedId(editsAtStart.value[relationPkField])
					: null;

				const newValue = props.value.map((item) => {
					if (junctionItem !== null && junctionPkField in junctionItem) {
						const id = junctionItem[junctionPkField];

						if (typeof item === 'object' && junctionPkField in item) {
							if (item[junctionPkField] === id)
								return { [junctionRelation]: edits, [junctionPkField]: id };
						} else if (typeof item === 'number' || typeof item === 'string') {
							if (item === id) return { [junctionRelation]: edits, [junctionPkField]: id };
						}
					}

					if (typeof item === 'object' && relationPkField in edits && junctionRelation in item) {
						const id = edits[relationPkField];
						const relatedItem = item[junctionRelation] as string | number | Record<string, any>;
						if (typeof relatedItem === 'object' && relationPkField in relatedItem) {
							if (relatedItem[relationPkField] === id) return editsWrapped;
						} else if (typeof relatedItem === 'string' || typeof relatedItem === 'number') {
							if (relatedItem === id) return editsWrapped;
						}
					}

					if (isEqual({ [junctionRelation]: editsAtStart.value }, item)) {
						return editsWrapped;
					}

					return item;
				});

				if (hasPrimaryKey === false && newValue.includes(editsWrapped) === false) {
					newValue.push(editsWrapped);
				}

				emit('input', newValue);
			}

			function cancelEdit() {
				editsAtStart.value = {};
				currentlyEditing.value = null;
			}
		}

		function useSelection() {
			const selectModalActive = ref(false);

			const selectedPrimaryKeys = computed<(number | string)[]>(() => {
				if (displayItems.value === null) return [];

				const { relationPkField } = relationFields.value;

				return displayItems.value
					.filter((currentItem) => relationPkField in currentItem)
					.map((currentItem) => currentItem[relationPkField]);
			});

			return { stageSelection, selectModalActive, selectedPrimaryKeys };

			function stageSelection(newSelection: (number | string)[]) {
				const { junctionRelation, junctionPkField } = relationFields.value;

				const newItems = getNewItems();

				if (junctionRelation === null) return;

				const selection = newSelection.map((item) => {
					const junction = getJunctionFromRelatedId(item);
					if (junction === null) return { [junctionRelation]: item };

					const updatedItem = getJunctionItem(junction[junctionPkField]);

					return updatedItem === null ? { [junctionRelation]: item } : updatedItem;
				});

				emit('input', [...selection, ...newItems]);
			}
		}

		function getDefaultFields(): string[] {
			const fields = fieldsStore.getFieldsForCollection(relationCollection.value.collection);
			return fields.slice(0, 3).map((field: Field) => field.field);
		}
	},
});
</script>

<style lang="scss" scoped>
.actions {
	margin-top: 12px;
}

.existing {
	margin-left: 12px;
}

.deselect {
	--v-icon-color: var(--foreground-subdued);

	&:hover {
		--v-icon-color: var(--danger);
	}
}
</style>
