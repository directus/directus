<template>
	<v-notice type="warning" v-if="!relation">
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
import { Filter, Field } from '@/types';
import { Header } from '@/components/v-table/types';

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

		const { relation, relatedCollection, relatedPrimaryKeyField } = useRelation();
		const { tableHeaders, displayItems, loading, error } = useTable();
		const { currentlyEditing, editItem, editsAtStart, stageEdits, cancelEdit } = useEdits();
		const { stageSelection, selectModalActive, selectionFilters } = useSelection();

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
			selectionFilters,
			deleteItem,
			displayItems,
		};

		function getItem(id: string | number) {
			const pkField = relatedPrimaryKeyField.value.field;
			if (props.value === null) return null;
			return (
				props.value.find(
					(item) => (typeof item === 'object' && pkField in item && item[pkField] === id) || item === id
				) || null
			);
		}

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
			return props.value.filter((item) => typeof item === 'object' && pkField in item === false) as Record<
				string,
				any
			>[];
		}

		function getExistingItems() {
			if (props.value === null) return [];
			const pkField = relatedPrimaryKeyField.value.field;
			return props.value.filter((item) => typeof item === 'string' || typeof item === 'number');
		}

		function deleteItem(item: Record<string, any>) {
			const relatedPrimKey = relatedPrimaryKeyField.value.field;
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
			const displayItems = ref<Record<string, any>[]>([]);
			const error = ref(null);

			watch(
				() => props.value,
				async (newVal) => {
					loading.value = true;
					const pkField = relatedPrimaryKeyField.value.field;

					let fields = [...(props.fields.length > 0 ? props.fields : getDefaultFields())];

					if (fields.includes(pkField) === false) {
						fields.push(pkField);
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

						const existingItems = (response.data.data[props.field] as Record<string, any>[]) || [];
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
				const primaryKey = item[relatedPrimaryKeyField.value.field];

				// When the currently staged value is an array, we know we made changes / added / removed
				// certain items. In that case, we have to extract the previously made edits so we can
				// keep moving forwards with those
				if (props.value !== null) {
					const existingEdits = getItem(primaryKey);

					if (existingEdits && typeof existingEdits === 'object') {
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

				const hasPrimaryKey = pkField in edits;

				if (props.value && Array.isArray(props.value)) {
					const newValue = props.value.map((existingChange) => {
						if (
							typeof existingChange === 'object' &&
							existingChange[pkField] &&
							edits[pkField] &&
							existingChange[pkField] === edits[pkField]
						) {
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
				if (displayItems.value === null) return [];

				const pkField = relatedPrimaryKeyField.value.field;

				return displayItems.value
					.filter((currentItem) => pkField in currentItem)
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
				const pkField = relatedPrimaryKeyField.value.field;
				const newItems = getNewItems();
				const selection = newSelection.map((item) => {
					const updatedItem = getItem(item);
					return updatedItem === null ? item : updatedItem;
				});

				emit('input', [...selection, ...newItems]);
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
