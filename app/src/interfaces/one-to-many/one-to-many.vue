<template>
	<v-notice type="warning" v-if="!relation">
		{{ $t('relationship_not_setup') }}
	</v-notice>
	<div class="one-to-many" v-else>
		<v-table
			:loading="currentLoading"
			:items="currentItems"
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
					:collection="relatedCollection.collection"
					:field="header.field.field"
				/>
			</template>

			<template #item-append="{ item }" v-if="!disabled">
				<v-icon name="close" v-tooltip="$t('deselect')" class="deselect" @click.stop="deselect(item)" />
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
			:collection="relatedCollection.collection"
			:primary-key="currentlyEditing || '+'"
			:edits="editsAtStart"
			@input="stageEdits"
			@update:active="cancelEdit"
		/>

		<modal-browse
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
import ModalDetail from '@/views/private/components/modal-detail';
import ModalBrowse from '@/views/private/components/modal-browse';
import { Filter } from '@/types';
import { Header } from '@/components/v-table/types';

export default defineComponent({
	components: { ModalDetail, ModalBrowse },
	props: {
		value: {
			type: Array,
			default: undefined,
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
			required: true,
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
		const { loading: currentLoading, items: currentItems } = useCurrent();
		const { tableHeaders } = useTable();
		const { currentlyEditing, editItem, editsAtStart, stageEdits, cancelEdit } = useEdits();
		const { stageSelection, selectModalActive, selectionFilters } = useSelection();

		return {
			currentLoading,
			currentItems,
			relation,
			tableHeaders,
			currentlyEditing,
			editItem,
			relatedCollection,
			editsAtStart,
			stageEdits,
			cancelEdit,
			stageSelection,
			selectModalActive,
			selectionFilters,
			deselect,
		};

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

		/**
		 * Manages the current display value (the rows in the table)
		 * This listens to changes in props.value to make sure we always display the correct info
		 * in the table itself
		 */
		function useCurrent() {
			const loading = ref(false);
			const items = ref<any[]>([]);
			const error = ref(null);

			// This is the primary key of the parent form, not the related items
			// By watching the primary key prop for this, it'll load the items fresh on load, but
			// also when we navigate from edit form to another edit form.
			watch(
				() => props.primaryKey,
				(newKey) => {
					if (newKey !== null && newKey !== '+' && Array.isArray(props.value) !== true) {
						fetchCurrent();
					}
				},
				{
					immediate: true,
				}
			);

			// The value can either be null (no changes), or an array of primary key / object with changes
			watch(
				() => props.value,
				(newValue) => {
					// When the value is null, there aren't any changes. It does not mean that all
					// related items are deselected
					if (newValue === null) {
						fetchCurrent();
					}

					if (Array.isArray(newValue)) {
						mergeWithItems(newValue);
					}
				}
			);

			return { loading, items, error, fetchCurrent };

			/**
			 * Fetch all related items based on the primary key of the current field. This is only
			 * run on first load (or when the parent form primary key changes)
			 */
			async function fetchCurrent() {
				loading.value = true;

				let fields = [...props.fields];

				if (fields.includes(relatedPrimaryKeyField.value.field) === false) {
					fields.push(relatedPrimaryKeyField.value.field);
				}

				// We're fetching these fields nested on the current item, so nest them in the current
				// field-key
				fields = fields.map((fieldKey) => `${props.field}.${fieldKey}`);

				try {
					const endpoint = props.collection.startsWith('directus_')
						? `/${props.collection.substring(9)}/${props.primaryKey}`
						: `/items/${props.collection}/${props.primaryKey}`;

					const response = await api.get(endpoint, {
						params: {
							fields: fields,
						},
					});

					items.value = response.data.data[props.field];
				} catch (err) {
					error.value = err;
				} finally {
					loading.value = false;
				}
			}

			/**
			 * Merges all changes / newly selected items with the current value array, so we can
			 * display the most up to date information in the table. This will merge edits with the
			 * existing items, and fetch the full item info when the item is newly selected (as it
			 * will only have a pk in the array of changes)
			 */
			async function mergeWithItems(changes: any[]) {
				loading.value = true;

				const pkField = relatedPrimaryKeyField.value.field;

				const itemsWithChangesApplied = items.value
					.map((item: any) => {
						const changeForThisItem = changes.find((change) => change[pkField] === item[pkField]);

						if (changeForThisItem) {
							return {
								...item,
								...changeForThisItem,
							};
						}

						return item;
					})
					.filter((item) => item.hasOwnProperty(pkField))
					.filter((item) => item[relation.value.many_field] !== null);

				const newlyAddedItems = changes.filter(
					(change) =>
						typeof change !== 'string' &&
						typeof change !== 'number' &&
						change.hasOwnProperty(pkField) === false
				);

				const selectedPrimaryKeys = changes
					.filter((change) => typeof change === 'string' || typeof change === 'number')
					.filter((primaryKey) => {
						const isAlsoUpdate = itemsWithChangesApplied.some((update) => update[pkField] === primaryKey);

						return isAlsoUpdate === false;
					});

				let selectedItems: any[] = [];

				if (selectedPrimaryKeys.length > 0) {
					const fields = [...props.fields];

					if (fields.includes(relatedPrimaryKeyField.value.field) === false) {
						fields.push(relatedPrimaryKeyField.value.field);
					}

					const endpoint = props.collection.startsWith('directus_')
						? `/${props.collection.substring(9)}/${selectedPrimaryKeys.join(',')}`
						: `/items/${relatedCollection.value.collection}/${selectedPrimaryKeys.join(',')}`;

					const response = await api.get(endpoint, {
						params: {
							fields: fields,
						},
					});

					if (Array.isArray(response.data.data)) {
						selectedItems = response.data.data;
					} else {
						selectedItems = [response.data.data];
					}
				}

				items.value = [...itemsWithChangesApplied, ...newlyAddedItems, ...selectedItems];
				loading.value = false;
			}
		}

		function useTable() {
			// Using a ref for the table headers here means that the table itself can update the
			// values if it needs to. This allows the user to manually resize the columns for example
			const tableHeaders = ref<Header[]>([]);

			// Seeing we don't care about saving those tableHeaders, we can reset it whenever the
			// fields prop changes (most likely when we're navigating to a different o2m context)
			watch(
				() => props.fields,
				() => {
					tableHeaders.value = props.fields
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
									display: field.display,
									displayOptions: field.display_options,
									interface: field.interface,
									interfaceOptions: field.options,
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

			return { tableHeaders };
		}

		function useEdits() {
			// Primary key of the item we're currently editing. If null, the edit modal should be
			// closed
			const currentlyEditing = ref<string | number | null>(null);

			// This keeps track of the starting values so we can match with it
			const editsAtStart = ref({});

			return { currentlyEditing, editItem, editsAtStart, stageEdits, cancelEdit };

			function editItem(item: any) {
				const primaryKey = item[relatedPrimaryKeyField.value.field];

				// When the currently staged value is an array, we know we made changes / added / removed
				// certain items. In that case, we have to extract the previously made edits so we can
				// keep moving forwards with those
				if (props.value && Array.isArray(props.value)) {
					const existingEdits = props.value.find((existingChange) => {
						const existingPK = existingChange[relatedPrimaryKeyField.value.field];
						if (!existingPK) return item === existingChange;
						return existingPK === primaryKey;
					});

					if (existingEdits) {
						editsAtStart.value = existingEdits;
					}
				}

				// Make sure the edits have the primary key included, otherwise the api will create
				// the item as a new one instead of update the existing
				if (primaryKey && editsAtStart.value.hasOwnProperty(relatedPrimaryKeyField.value.field) === false) {
					editsAtStart.value = {
						...editsAtStart.value,
						[relatedPrimaryKeyField.value.field]: primaryKey,
					};
				}

				currentlyEditing.value = primaryKey;
			}

			function stageEdits(edits: any) {
				const pkField = relatedPrimaryKeyField.value.field;

				const hasPrimaryKey = edits.hasOwnProperty(pkField);

				if (props.value && Array.isArray(props.value)) {
					const newValue = props.value.map((existingChange) => {
						if (existingChange[pkField] && edits[pkField] && existingChange[pkField] === edits[pkField]) {
							return edits;
						}

						if (existingChange === edits[pkField]) {
							return edits;
						}

						if (editsAtStart.value === existingChange) {
							return edits;
						}

						return existingChange;
					});

					if (hasPrimaryKey === false && newValue.includes(edits) === false) {
						newValue.push(edits);
					}

					emit('input', newValue);
				} else {
					emit('input', [edits]);
				}
			}

			function cancelEdit() {
				editsAtStart.value = {};
				currentlyEditing.value = null;
			}
		}

		function useSelection() {
			const selectModalActive = ref(false);

			const selectedPrimaryKeys = computed<(number | string)[]>(() => {
				if (!currentItems.value) return [];
				const pkField = relatedPrimaryKeyField.value.field;
				return currentItems.value
					.filter((currentItem) => currentItem.hasOwnProperty(pkField))
					.map((currentItem) => currentItem[pkField]);
			});

			const selectionFilters = computed<Filter[]>(() => {
				const filter: Filter = {
					key: 'selection',
					field: relatedPrimaryKeyField.value.field,
					operator: 'nin',
					value: selectedPrimaryKeys.value.join(','),
				};

				return [filter];
			});

			return { stageSelection, selectModalActive, selectionFilters };

			function stageSelection(newSelection: (number | string)[]) {
				if (props.value && Array.isArray(props.value)) {
					emit('input', [...props.value, ...newSelection]);
				} else {
					emit('input', newSelection);
				}
			}
		}

		function deselect(item: any) {
			const pkField = relatedPrimaryKeyField.value.field;

			const itemPrimaryKey = item[pkField];

			// If the edited item doesn't have a primary key, it's new. In that case, filtering
			// it out of props.value should be enough to remove it
			if (itemPrimaryKey === undefined) {
				return emit(
					'input',
					props.value.filter((stagedValue) => stagedValue !== item)
				);
			}

			// If there's no staged value, it's safe to assume this item was already selected before
			// and has to be deselected
			if (props.value === null) {
				return emit('input', [
					{
						[pkField]: itemPrimaryKey,
						[relation.value.many_field]: null,
					},
				]);
			}

			// If the item is selected in the current edits, it will only have staged the primary
			// key so the API is able to properly set it on first creation. In that case, we have
			// to filter out the primary key
			const itemWasNewlySelect = !!props.value.find((stagedItem) => stagedItem === itemPrimaryKey);

			if (itemWasNewlySelect) {
				currentItems.value = currentItems.value.filter(
					(itemPreview) => itemPreview[pkField] !== itemPrimaryKey
				);

				return emit(
					'input',
					props.value.filter((stagedValue) => stagedValue !== itemPrimaryKey)
				);
			}

			const itemHasEdits =
				props.value.find((stagedItem: any) => stagedItem[pkField] === itemPrimaryKey) !== undefined;

			if (itemHasEdits) {
				return emit(
					'input',
					props.value.map((stagedValue: any) => {
						if (stagedValue[pkField] === itemPrimaryKey) {
							return {
								[pkField]: itemPrimaryKey,
								[relation.value.many_field]: null,
							};
						}

						return stagedValue;
					})
				);
			}

			return emit('input', [
				...props.value,
				{
					[pkField]: itemPrimaryKey,
					[relation.value.many_field]: null,
				},
			]);
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
