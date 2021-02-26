<template>
	<v-notice type="warning" v-if="!relation">
		{{ $t('relationship_not_setup') }}
	</v-notice>
	<div class="one-to-many" v-else>
		<v-table
			:loading="loading"
			:items="sortedItems || items"
			:headers.sync="tableHeaders"
			show-resize
			inline
			:sort.sync="sort"
			@update:items="sortItems($event)"
			@click:row="editItem"
			:disabled="disabled"
			:show-manual-sort="relation.sort_field !== null"
			:manual-sort-key="relation.sort_field"
		>
			<template v-for="header in tableHeaders" v-slot:[`item.${header.value}`]="{ item }">
				<render-display
					:key="header.value"
					:value="get(item, header.value)"
					:display="header.field.display"
					:options="header.field.displayOptions"
					:interface="header.field.interface"
					:interface-options="header.field.interfaceOptions"
					:type="header.field.type"
					:collection="relatedCollection.collection"
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

		<drawer-item
			v-if="!disabled"
			:active="currentlyEditing !== null"
			:collection="relatedCollection.collection"
			:primary-key="currentlyEditing || '+'"
			:edits="editsAtStart"
			@input="stageEdits"
			@update:active="cancelEdit"
		/>

		<drawer-collection
			v-if="!disabled"
			:active.sync="selectModalActive"
			:collection="relatedCollection.collection"
			:selection="[]"
			:filters="selectionFilters"
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
import DrawerItem from '@/views/private/components/drawer-item';
import DrawerCollection from '@/views/private/components/drawer-collection';
import { Filter, Field } from '@/types';
import { Header, Sort } from '@/components/v-table/types';
import { isEqual, sortBy } from 'lodash';
import { get } from 'lodash';
import { unexpectedError } from '@/utils/unexpected-error';

export default defineComponent({
	components: { DrawerItem, DrawerCollection },
	props: {
		value: {
			type: Array as PropType<(number | string | Record<string, any>)[] | null>,
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

		const { relation, relatedCollection, relatedPrimaryKeyField } = useRelation();
		const { tableHeaders, items, loading } = useTable();
		const { currentlyEditing, editItem, editsAtStart, stageEdits, cancelEdit } = useEdits();
		const { stageSelection, selectModalActive, selectionFilters } = useSelection();
		const { sort, sortItems, sortedItems } = useSort();

		return {
			relation,
			tableHeaders,
			loading,
			currentlyEditing,
			editItem,
			relatedCollection,
			editsAtStart,
			stageEdits,
			cancelEdit,
			stageSelection,
			selectModalActive,
			deleteItem,
			items,
			sortItems,
			selectionFilters,
			sort,
			sortedItems,
			get,
		};

		function getNewItems() {
			const pkField = relatedPrimaryKeyField.value.field;
			if (props.value === null) return [];
			return props.value.filter((item) => typeof item === 'object' && pkField in item === false) as Record<
				string,
				any
			>[];
		}

		function getUpdatedItems() {
			const pkField = relatedPrimaryKeyField.value.field;
			if (props.value === null) return [];
			return props.value.filter((item) => typeof item === 'object' && pkField in item === true) as Record<
				string,
				any
			>[];
		}

		function getPrimaryKeys() {
			if (props.value === null) return [];
			const pkField = relatedPrimaryKeyField.value.field;
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
			if (props.value === null) return;

			const relatedPrimKey = relatedPrimaryKeyField.value.field;

			if (relatedPrimKey in item === false) {
				emit(
					'input',
					props.value.filter((val) => isEqual(item, val) === false)
				);
				return;
			}

			const id = item[relatedPrimKey];
			emit(
				'input',
				props.value.filter((item) => {
					if (typeof item === 'number' || typeof item === 'string') return item !== id;
					if (typeof item === 'object' && relatedPrimKey in item) {
						return item[relatedPrimKey] !== id;
					}
					return true;
				})
			);
		}

		function useSort() {
			const sort = ref<Sort>({ by: relation.value.sort_field || props.fields[0], desc: false });

			function sortItems(newItems: Record<string, any>[]) {
				if (relation.value.sort_field === null) return;

				const itemsSorted = newItems.map((item, i) => {
					item[relation.value.sort_field] = i;
					return item;
				});

				emit('input', itemsSorted);
			}

			const sortedItems = computed(() => {
				if (relation.value.sort_field === null || sort.value.by !== relation.value.sort_field) return null;

				const desc = sort.value.desc;
				const sorted = sortBy(items.value, [relation.value.sort_field]);
				return desc ? sorted.reverse() : sorted;
			});

			return { sort, sortItems, sortedItems };
		}

		/**
		 * Holds info about the current relationship, like related collection, primary key field
		 * of the other collection etc
		 */
		function useRelation() {
			const relation = computed(() => {
				return relationsStore.getRelationsForField(props.collection, props.field)?.[0];
			});

			const relatedCollection = computed(() => {
				return collectionsStore.getCollection(relation.value.many_collection)!;
			});

			const { primaryKeyField: relatedPrimaryKeyField } = useCollection(relatedCollection.value.collection);

			return { relation, relatedCollection, relatedPrimaryKeyField };
		}

		function useTable() {
			// Using a ref for the table headers here means that the table itself can update the
			// values if it needs to. This allows the user to manually resize the columns for example
			const tableHeaders = ref<Header[]>([]);
			const loading = ref(false);
			const items = ref<Record<string, any>[]>([]);

			watch(
				() => props.value,
				async () => {
					loading.value = true;
					const pkField = relatedPrimaryKeyField.value.field;

					const fields = [...(props.fields.length > 0 ? props.fields : getDefaultFields())];

					if (fields.includes(pkField) === false) {
						fields.push(pkField);
					}

					if (relation.value.sort_field !== null && fields.includes(relation.value.sort_field) === false)
						fields.push(relation.value.sort_field);

					try {
						const endpoint = relatedCollection.value.collection.startsWith('directus_')
							? `/${relatedCollection.value.collection.substring(9)}`
							: `/items/${relatedCollection.value.collection}`;

						const primaryKeys = getPrimaryKeys();

						let existingItems: any[] = [];

						if (primaryKeys && primaryKeys.length > 0) {
							const response = await api.get(endpoint, {
								params: {
									fields: fields,
									[`filter[${pkField}][_in]`]: primaryKeys.join(','),
								},
							});

							existingItems = response.data.data;
						}

						const updatedItems = getUpdatedItems();
						const newItems = getNewItems();

						items.value = existingItems
							.map((item) => {
								const updatedItem = updatedItems.find((updated) => updated[pkField] === item[pkField]);

								if (updatedItem !== undefined) {
									return {
										...item,
										...updatedItem,
									};
								}

								return item;
							})
							.concat(...newItems);
					} catch (err) {
						unexpectedError(err);
					} finally {
						loading.value = false;
					}
				},
				{ immediate: true }
			);

			// Seeing we don't care about saving those tableHeaders, we can reset it whenever the
			// fields prop changes (most likely when we're navigating to a different o2m context)
			watch(
				() => props.fields,
				() => {
					tableHeaders.value = (props.fields.length > 0 ? props.fields : getDefaultFields())
						.map((fieldKey) => {
							const field = fieldsStore.getField(relatedCollection.value.collection, fieldKey);

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

			return { tableHeaders, items, loading };
		}

		function useEdits() {
			// Primary key of the item we're currently editing. If null, the edit modal should be
			// closed
			const currentlyEditing = ref<string | number | null>(null);

			// This keeps track of the starting values so we can match with it
			const editsAtStart = ref({});

			return { currentlyEditing, editItem, editsAtStart, stageEdits, cancelEdit };

			function editItem(item: any) {
				const pkField = relatedPrimaryKeyField.value.field;
				const hasPrimaryKey = pkField in item;

				const edits = (props.value || []).find((edit: any) => edit === item);

				editsAtStart.value = edits || { [pkField]: item[pkField] || {} };
				currentlyEditing.value = hasPrimaryKey ? item[pkField] : '+';
			}

			function stageEdits(edits: any) {
				const pkField = relatedPrimaryKeyField.value.field;

				const newValue = (props.value || []).map((item) => {
					if (typeof item === 'object' && pkField in item && pkField in edits && item[pkField] === edits[pkField]) {
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

				if (newValue.includes(edits) === false) {
					newValue.push(edits);
				}

				if (newValue.length === 0) emit('input', null);
				else emit('input', newValue);
			}

			function cancelEdit() {
				editsAtStart.value = {};
				currentlyEditing.value = null;
			}
		}

		function useSelection() {
			const selectModalActive = ref(false);

			const selectedPrimaryKeys = computed<(number | string)[]>(() => {
				if (items.value === null) return [];

				const pkField = relatedPrimaryKeyField.value.field;

				return items.value.filter((currentItem) => pkField in currentItem).map((currentItem) => currentItem[pkField]);
			});

			const selectionFilters = computed<Filter[]>(() => {
				const pkField = relatedPrimaryKeyField.value.field;

				if (selectedPrimaryKeys.value.length === 0) return [];

				const filter: Filter = {
					key: 'selection',
					field: pkField,
					operator: 'nin',
					value: selectedPrimaryKeys.value.join(','),
					locked: true,
				};

				return [filter];
			});

			return { stageSelection, selectModalActive, selectionFilters };

			function stageSelection(newSelection: (number | string)[]) {
				const selection = newSelection.filter((item) => selectedPrimaryKeys.value.includes(item) === false);

				const newVal = [...selection, ...(props.value || [])];

				if (newVal.length === 0) emit('input', null);
				else emit('input', newVal);
			}
		}

		function getDefaultFields(): string[] {
			const fields = fieldsStore.getFieldsForCollection(relatedCollection.value.collection);
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
