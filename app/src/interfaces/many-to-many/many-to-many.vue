<template>
	<v-notice type="warning" v-if="!junction">
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
			:collection="junctionCollection.collection"
			:primary-key="currentlyEditing || '+'"
			:edits="editsAtStart"
			@input="stageEdits"
			@update:active="cancelEdit"
		/>

		<modal-browse
			v-if="!disabled"
			:active.sync="selectModalActive"
			:collection="junctionCollection.collection"
			:selection="selectedPrimaryKeys"
			:filters="[]"
			@input="stageSelection"
			multiple
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, PropType } from '@vue/composition-api';
import api from '@/api';
import useCollection from '@/composables/use-collection';
import { useCollectionsStore, useRelationsStore, useFieldsStore } from '@/stores/';
import ModalDetail from '@/views/private/components/modal-detail';
import ModalBrowse from '@/views/private/components/modal-browse';
import { Filter, Field } from '@/types';
import { Header } from '@/components/v-table/types';
import { Relation } from '@/types';

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
		const relationsStore = useRelationsStore();
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();

		const {
			junction,
			junctionCollection,
			junctionPrimaryKeyField,
			relation,
			relationCollection,
			relationPrimaryKeyField,
		} = useRelation();
		const { tableHeaders, displayItems, loading, error } = useTable();
		const { currentlyEditing, editItem, editsAtStart, stageEdits, cancelEdit } = useEdits();
		const { stageSelection, selectModalActive, selectedPrimaryKeys } = useSelection();

		return {
			junction,
			tableHeaders,
			loading,
			currentlyEditing,
			editItem,
			junctionCollection,
			editsAtStart,
			stageEdits,
			cancelEdit,
			stageSelection,
			selectModalActive,
			deleteItem,
			displayItems,
			selectedPrimaryKeys,
		};

		function getItem(id: string | number) {
			const pkField = junctionPrimaryKeyField.value.field;
			if (props.value === null) return null;
			return (
				props.value.find(
					(item) => (typeof item === 'object' && pkField in item && item[pkField] === id) || item === id
				) || null
			);
		}

		function getNewItems() {
			const pkField = junctionPrimaryKeyField.value.field;
			if (props.value === null) return [];
			return props.value.filter((item) => typeof item === 'object' && pkField in item === false) as Record<
				string,
				any
			>[];
		}

		function getUpdatedItems() {
			const pkField = junctionPrimaryKeyField.value.field;
			if (props.value === null) return [];
			return props.value.filter((item) => typeof item === 'object' && pkField in item === false) as Record<
				string,
				any
			>[];
		}

		function getExistingItems() {
			if (props.value === null) return [];
			const pkField = junctionPrimaryKeyField.value.field;
			return props.value.filter((item) => typeof item === 'string' || typeof item === 'number');
		}

		function getPrimaryKeys() {
			if (props.value === null) return [];
			const pkField = junctionPrimaryKeyField.value.field;
			return props.value
				.map((item) => {
					if (typeof item === 'object') {
						if (pkField in item) return item[pkField];
					} else {
						return item;
					}
				})
				.filter((i) => i);
		}

		function deleteItem(item: Record<string, any>) {
			const relatedPrimKey = junctionPrimaryKeyField.value.field;
			const id = item[relatedPrimKey];

			emit(
				'input',
				props.value.filter((item) => {
					if (typeof item === 'number' || typeof item === 'string') return item !== id;
					if (typeof item === 'object' && relatedPrimKey in item) {
						return item[relatedPrimKey] !== id;
					}
				})
			);
		}

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

			return {
				junction,
				junctionCollection,
				junctionPrimaryKeyField,
				relation,
				relationCollection,
				relationPrimaryKeyField,
			};
		}

		function useTable() {
			// Using a ref for the table headers here means that the table itself can update the
			// values if it needs to. This allows the user to manually resize the columns for example
			const tableHeaders = ref<Header[]>([]);
			const loading = ref(false);
			const displayItems = ref<Record<string, any>[]>([]);
			const error = ref(null);

			watch(
				() => props.value,
				async (newVal) => {
					loading.value = true;
					const pkField = junctionPrimaryKeyField.value.field;

					const relatedPrimaryKeys = await loadRelatedIds(newVal);

					const fields = [...(props.fields.length > 0 ? props.fields : getDefaultFields())];

					if (fields.includes(pkField) === false) {
						fields.push(pkField);
					}

					try {
						const endpoint = junctionCollection.value.collection.startsWith('directus_')
							? `/${junctionCollection.value.collection.substring(9)}`
							: `/items/${junctionCollection.value.collection}`;

						const response = await api.get(endpoint, {
							params: {
								fields: fields,
								[`filter[${pkField}][_in]`]: relatedPrimaryKeys.join(','),
							},
						});

						const existingItems = (response.data.data as Record<string, any>[]) || [];
						const updatedItems = getUpdatedItems();
						const newItems = getNewItems();

						displayItems.value = existingItems
							.map((item) => {
								const updatedItem = updatedItems.find((updated) => updated[pkField] === item[pkField]);
								if (updatedItem !== undefined) return updatedItem;
								return item;
							})
							.concat(...newItems);
					} catch (err) {
						error.value = err;
					} finally {
						loading.value = false;
					}
				},
				{ immediate: true }
			);

			async function loadRelatedIds(newVal: (string | number | Record<string, any>)[]) {
				try {
					const endpoint = junctionCollection.value.collection.startsWith('directus_')
						? `/${junctionCollection.value.collection.substring(9)}`
						: `/items/${junctionCollection.value.collection}`;

					const response = await api.get(endpoint, {
						params: {
							fields: junction.value.junction_field,
							[`filter[${junctionPrimaryKeyField.value.field}][_in]`]: getPrimaryKeys().join(','),
						},
					});

					console.log(response.data.data);
					return response.data.data;
				} catch (err) {
					error.value = err;
				}
			}

			// Seeing we don't care about saving those tableHeaders, we can reset it whenever the
			// fields prop changes (most likely when we're navigating to a different o2m context)
			watch(
				() => props.fields,
				() => {
					tableHeaders.value = (props.fields.length > 0 ? props.fields : getDefaultFields())
						.map((fieldKey) => {
							const field = fieldsStore.getField(junctionCollection.value.collection, fieldKey);

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

			return { tableHeaders, displayItems, loading, error };
		}

		function useEdits() {
			// Primary key of the item we're currently editing. If null, the edit modal should be
			// closed
			const currentlyEditing = ref<string | number | null>(null);

			// This keeps track of the starting values so we can match with it
			const editsAtStart = ref({});

			return { currentlyEditing, editItem, editsAtStart, stageEdits, cancelEdit };

			function editItem(item: any) {
				const pkField = junctionPrimaryKeyField.value.field;
				const hasPrimaryKey = pkField in item;

				editsAtStart.value = item;
				currentlyEditing.value = hasPrimaryKey ? item[pkField] : 1;
			}

			function stageEdits(edits: any) {
				const pkField = junctionPrimaryKeyField.value.field;

				const hasPrimaryKey = pkField in edits;

				if (props.value === null) return emit('input', [edits]);

				const newValue = props.value.map((item) => {
					if (
						typeof item === 'object' &&
						pkField in item &&
						pkField in edits &&
						item[pkField] === edits[pkField]
					) {
						return edits;
					}

					if (item === edits[pkField]) {
						return edits;
					}

					if (editsAtStart.value === item) {
						return edits;
					}

					return item;
				});

				if (hasPrimaryKey === false && newValue.includes(edits) === false) {
					newValue.push(edits);
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

				const pkField = junctionPrimaryKeyField.value.field;

				return displayItems.value
					.filter((currentItem) => pkField in currentItem)
					.map((currentItem) => currentItem[pkField]);
			});

			return { stageSelection, selectModalActive, selectedPrimaryKeys };

			function stageSelection(newSelection: (number | string)[]) {
				console.log(newSelection);

				const pkField = junctionPrimaryKeyField.value.field;
				const newItems = getNewItems();
				const selection = newSelection.map((item) => {
					const updatedItem = getItem(item);
					return updatedItem === null ? item : updatedItem;
				});

				emit('input', [...selection, ...newItems]);
			}
		}

		function getDefaultFields(): string[] {
			const fields = fieldsStore.getFieldsForCollection(junctionCollection.value.collection);
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
