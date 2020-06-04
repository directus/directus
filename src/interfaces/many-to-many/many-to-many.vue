<template>
	<v-notice type="warning" v-if="!relations || relations.length !== 2">
		{{ $t('relationship_not_setup') }}
	</v-notice>
	<div v-else class="files">
		<v-table
			inline
			:items="previewItems"
			:loading="loading"
			:headers.sync="tableHeaders"
			:item-key="junctionCollectionPrimaryKeyField.field"
			:disabled="disabled"
			@click:row="editExisting"
			show-resize
		>
			<template v-for="header in tableHeaders" v-slot:[`item.${header.value}`]="{ item }">
				<render-display
					:key="header.value"
					:value="get(item, header.value)"
					:display="header.field.display"
					:options="header.field.display_options"
					:interface="header.field.interface"
					:interface-options="header.field.options"
					:type="header.field.type"
					:collection="header.field.collection"
					:field="header.field.field"
				/>
			</template>

			<template #item-append="{ item }" v-if="!disabled">
				<v-icon name="close" v-tooltip="$t('deselect')" class="deselect" @click.stop="deselect(item)" />
			</template>
		</v-table>

		<div class="actions" v-if="!disabled">
			<v-button class="new" @click="addNew">{{ $t('add_new') }}</v-button>
			<v-button class="existing" @click="showBrowseModal = true">
				{{ $t('add_existing') }}
			</v-button>
		</div>

		<modal-detail
			v-if="!disabled"
			:active="showDetailModal"
			:collection="junctionCollection"
			:primary-key="junctionRowPrimaryKey"
			:edits="editsAtStart"
			:junction-field="relationCurrentToJunction.junction_field"
			:related-primary-key="relatedRowPrimaryKey"
			@input="stageEdits"
			@update:active="cancelEdit"
		/>

		<modal-browse
			v-if="!disabled"
			:active.sync="showBrowseModal"
			:collection="relationJunctionToRelated.collection_one"
			:selection="[]"
			:filters="selectionFilters"
			@input="stageSelection"
			multiple
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, PropType } from '@vue/composition-api';
import useRelationsStore from '@/stores/relations';
import { Relation } from '@/stores/relations/types';
import useProjectsStore from '@/stores/projects';
import useCollection from '@/composables/use-collection';
import useFieldsStore from '@/stores/fields';
import { Header as TableHeader } from '@/components/v-table/types';
import ModalBrowse from '@/views/private/components/modal-browse';
import ModalDetail from '@/views/private/components/modal-detail';
import api from '@/api';
import { Filter } from '@/stores/collection-presets/types';
import { merge, set, get } from 'lodash';
import adjustFieldsForDisplay from '@/utils/adjust-fields-for-displays';

/**
 * Hi there!
 *
 * As you can see by the length of this file and the amount of comments, getting the many to many
 * right is super complex. Please take proper care when jumping in here and making changes, you might
 * break more than you'd imagine.
 *
 * If you have any questions, please feel free to reach out to Rijk <rijkvanzanten@me.com>
 *
 * NOTE: Some of the logic here is based on the fact that you can only have 1 copy of a related item
 * associated in the m2m at a time. Without this requirement, there isn't a way to know which item
 * you're editing at a time. It would also be near impossible to keep track of the changes made to the
 * related item. Seeing we stage the made edits nested so the api is able to update it, we would have
 * to apply the same edits nested to all the junction rows or something like that, pretty tricky stuff
 *
 * Another NOTE: There's 1 tricky case to be aware of: selecting an existing related item. In that case,
 * the junction row doesn't exist yet, but the related item does. Be aware that you can't rely on the
 * primary key of the junction row in some cases.
 */

export default defineComponent({
	components: { ModalBrowse, ModalDetail },
	props: {
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
		value: {
			type: Array,
			default: undefined,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		fields: {
			type: Array as PropType<string[]>,
			required: true,
		},
	},
	setup(props, { emit }) {
		const relationsStore = useRelationsStore();
		const fieldsStore = useFieldsStore();
		const projectsStore = useProjectsStore();

		const {
			relations,
			relationCurrentToJunction,
			relationJunctionToRelated,
			junctionCollectionPrimaryKeyField,
			junctionCollection,
			relatedCollectionPrimaryKeyField,
			relatedCollection,
		} = useRelation();
		const { tableHeaders } = useTable();
		const { loading, previewItems, error } = usePreview();
		const {
			showDetailModal,
			cancelEdit,
			addNew,
			stageEdits,
			editsAtStart,
			junctionRowPrimaryKey,
			editExisting,
			relatedRowPrimaryKey,
			initialValues,
		} = useEdit();
		const { showBrowseModal, stageSelection, selectionFilters } = useSelection();

		return {
			relations,
			relationCurrentToJunction,
			relationJunctionToRelated,
			tableHeaders,
			junctionCollectionPrimaryKeyField,
			junctionCollection,
			loading,
			previewItems,
			error,
			showDetailModal,
			cancelEdit,
			addNew,
			stageEdits,
			editsAtStart,
			junctionRowPrimaryKey,
			editExisting,
			relatedRowPrimaryKey,
			showBrowseModal,
			stageSelection,
			selectionFilters,
			relatedCollection,
			initialValues,
			get,
			deselect,
		};

		/**
		 * Information on the relation to the junction and related collection
		 */
		function useRelation() {
			// We expect two relations to exist for this field: one from this field to the junction
			// table, and one from the junction table to the related collection
			const relations = computed<Relation[]>(() => {
				return relationsStore.getRelationsForField(props.collection, props.field);
			});

			const relationCurrentToJunction = computed(() => {
				return relations.value.find(
					(relation: Relation) =>
						relation.collection_one === props.collection && relation.field_one === props.field
				);
			});

			const relationJunctionToRelated = computed(() => {
				if (!relationCurrentToJunction.value) return null;

				const index = relations.value.indexOf(relationCurrentToJunction.value) === 1 ? 0 : 1;
				return relations.value[index];
			});

			const junctionCollection = computed(() => relations.value[0].collection_many);
			const relatedCollection = computed(() => relations.value[1].collection_one);

			const { primaryKeyField: junctionCollectionPrimaryKeyField } = useCollection(junctionCollection);
			const { primaryKeyField: relatedCollectionPrimaryKeyField } = useCollection(relatedCollection);

			return {
				relations,
				relationCurrentToJunction,
				relationJunctionToRelated,
				junctionCollection,
				junctionCollectionPrimaryKeyField,
				relatedCollection,
				relatedCollectionPrimaryKeyField,
			};
		}

		/**
		 * Controls what preview is shown in the table. Has some black magic logic to ensure we're able
		 * to show the latest edits, while also maintaining a clean staged value set. This is not responsible
		 * for setting or modifying any data. Preview items should be considered read only
		 */
		function usePreview() {
			const loading = ref(false);
			const previewItems = ref<readonly any[]>([]);
			const error = ref(null);

			// Every time the value changes, we'll reset the preview values. This ensures that we'll
			// almost show the most up to date information in the preview table, regardless of if this
			// is the first load or a subsequent edit.
			watch(() => props.value, setPreview);

			return { loading, previewItems, error };

			async function setPreview() {
				loading.value = true;

				try {
					const existingItems = await fetchExisting();
					const updatedExistingItems = applyUpdatesToExisting(existingItems);
					const newlyAddedItems = getNewlyAdded();
					const newlySelectedItems = await fetchNewlySelectedItems();
					previewItems.value = [...updatedExistingItems, ...newlyAddedItems, ...newlySelectedItems].filter(
						(stagedEdit: any) => !stagedEdit['$delete']
					);
				} catch (err) {
					error.value = err;
				} finally {
					loading.value = false;
				}
			}

			/**
			 * Looks through props.value and applies all staged changes to the existing selected
			 * items. The array of existing items is an array of junction rows, so we can assume
			 * those have a primary key
			 */
			function applyUpdatesToExisting(existing: any[]) {
				return existing.map((existingValue) => {
					const junctionPrimaryKey = junctionCollectionPrimaryKeyField.value.field;
					const existingPrimaryKey = existingValue[junctionPrimaryKey];

					const stagedEdits: any = (props.value || []).find((update: any) => {
						const updatePrimaryKey = update[junctionPrimaryKey];
						return existingPrimaryKey === updatePrimaryKey;
					});

					if (stagedEdits === undefined) return existingValue;

					return {
						...merge(existingValue, stagedEdits),
						$stagedEdits: stagedEdits,
					};
				});
			}

			/**
			 * To get the currently selected items, we'll fetch the rows from the junction table
			 * where the field back to the current collection is equal to the primary key. We go
			 * this route as it's more performant than trying to go an extra level deep in the
			 * current item.
			 */
			async function fetchExisting() {
				if (!relationCurrentToJunction.value) return;
				if (!relationCurrentToJunction.value.junction_field) return;
				if (!relationJunctionToRelated.value) return;
				if (!relationJunctionToRelated.value.junction_field) return;

				// If the current item is being created, we don't have to search for existing relations
				// yet, as they can't have been saved yet.
				if (props.primaryKey === '+') return [];

				const { currentProjectKey } = projectsStore.state;
				const junctionTable = relationCurrentToJunction.value.collection_many;

				// The stuff we want to fetch is the related junction row, and the content of the
				// deeply related item nested. This should match the value that's set in the fields
				// option. We have to make sure we're fetching the primary key of both the junction
				// as the related item though, as that makes sure we're able to update the item later,
				// instead of adding a new one in the API.
				const fields = [...props.fields];

				// The following will add the PK and related items PK to the request fields, like
				// "id" and "related.id"
				const junctionPrimaryKey = junctionCollectionPrimaryKeyField.value.field;
				const junctionField = relationCurrentToJunction.value.junction_field;
				const relatedPrimaryKey = relatedCollectionPrimaryKeyField.value.field;
				const currentInJunction = relationJunctionToRelated.value.junction_field;

				if (fields.includes(junctionPrimaryKey) === false) fields.push(junctionPrimaryKey);
				if (fields.includes(`${junctionField}.${relatedPrimaryKey}`) === false)
					fields.push(`${junctionField}.${relatedPrimaryKey}`);

				const response = await api.get(`/${currentProjectKey}/items/${junctionTable}`, {
					params: {
						fields: adjustFieldsForDisplay(fields, junctionCollection.value),
						[`filter[${currentInJunction}][eq]`]: props.primaryKey,
					},
				});

				return response.data.data;
			}

			/**
			 * Extract the newly created rows from props.value. Values that don't have a junction row
			 * primary key and no primary key in the related item are created "totally" new and should
			 * be added to the array of previews as is.
			 * NOTE: This does not included items where the junction row is new, but the related item
			 * isn't.
			 */
			function getNewlyAdded() {
				if (!relationCurrentToJunction.value) return [];
				if (!relationCurrentToJunction.value.junction_field) return [];

				/**
				 * @NOTE There's an interesting case here:
				 *
				 * If you create both a new junction row _and_ a new related row, any selected existing
				 * many to one record won't have it's data object staged, as it already exists (so it's just)
				 * the primary key. This will case a template display to show ???, as it only gets the
				 * primary key. If you saw an issue about that on GitHub, this is where to find it.
				 *
				 * Unlike in fetchNewlySelectedItems(), we can't just fetch the related item, as both
				 * junction and related are new. We _could_ traverse through the object of changes, see
				 * if there's any relational field, and fetch the data based on that combined with the
				 * fields adjusted for the display. While that should work, it's too much of an edge case
				 * for me for now to worry about..
				 */

				return (props.value || []).filter((stagedEdit: any) => !stagedEdit['$delete']).filter(isNew);
			}

			/**
			 * The tricky case where the user selects an existing item from the related collection
			 * This means the junction doesn't have a primary key yet, and the only value that is
			 * staged is the related item's primary key
			 * In this function, we'll fetch the full existing item from the related collection,
			 * so we can still show it's data in the preview table
			 */
			async function fetchNewlySelectedItems() {
				if (!relationCurrentToJunction.value) return [];
				if (!relationCurrentToJunction.value.junction_field) return [];
				if (!relationJunctionToRelated.value) return [];
				if (!relationJunctionToRelated.value.junction_field) return [];

				const { currentProjectKey } = projectsStore.state;

				const junctionPrimaryKey = junctionCollectionPrimaryKeyField.value.field;
				const junctionField = relationCurrentToJunction.value.junction_field;
				const relatedPrimaryKey = relatedCollectionPrimaryKeyField.value.field;

				const newlySelectedStagedItems = (props.value || [])
					.filter((stagedEdit: any) => !stagedEdit['$delete'])
					.filter((stagedEdit: any) => {
						return (
							stagedEdit[junctionPrimaryKey] === undefined &&
							stagedEdit[junctionField]?.[relatedPrimaryKey] !== undefined
						);
					});

				const newlySelectedRelatedKeys = newlySelectedStagedItems.map(
					(stagedEdit: any) => stagedEdit[junctionField][relatedPrimaryKey]
				);

				// If there's no newly selected related items, we can return here, as there's nothing
				// to fetch
				if (newlySelectedRelatedKeys.length === 0) return [];

				// The fields option are set from the viewport of the junction table. Seeing we only
				// fetch from the related table, we have to filter out all the fields from the junction
				// table and remove the junction field prefix from the related table columns
				const fields = props.fields
					.filter((field) => field.startsWith(junctionField))
					.map((relatedField) => {
						return relatedField.replace(junctionField + '.', '');
					});

				if (fields.includes(relatedPrimaryKey) === false) fields.push(relatedPrimaryKey);

				const response = await api.get(
					`/${currentProjectKey}/items/${relatedCollection.value}/${newlySelectedRelatedKeys.join(',')}`,
					{
						params: {
							fields: adjustFieldsForDisplay(fields, junctionCollection.value),
						},
					}
				);

				const data = Array.isArray(response.data.data) ? response.data.data : [response.data.data];

				return newlySelectedStagedItems.map((stagedEdit: any) => {
					const pk = stagedEdit[junctionField][relatedPrimaryKey];

					const relatedItem = data.find((relatedItem: any) => relatedItem[relatedPrimaryKey] === pk);

					return merge(
						{
							[junctionField]: relatedItem,
							$stagedEdits: stagedEdit,
						},
						stagedEdit
					);
				});
			}
		}

		/**
		 * Everything regarding the edit experience in the detail modal. This also includes adding
		 * a new item
		 */
		function useEdit() {
			const showDetailModal = ref(false);
			// The previously made edits when we're starting to edit the item
			const editsAtStart = ref<any>(null);
			const junctionRowPrimaryKey = ref<number | string>('+');
			const relatedRowPrimaryKey = ref<number | string>('+');
			const initialValues = ref<any>(null);

			return {
				showDetailModal,
				editsAtStart,
				addNew,
				cancelEdit,
				stageEdits,
				junctionRowPrimaryKey,
				editExisting,
				relatedRowPrimaryKey,
				initialValues,
			};

			function addNew() {
				editsAtStart.value = null;
				showDetailModal.value = true;
				junctionRowPrimaryKey.value = '+';
				relatedRowPrimaryKey.value = '+';
				initialValues.value = null;
			}

			// The row here is the item in previewItems that's passed to the table
			function editExisting(item: any) {
				if (!relationCurrentToJunction.value) return;
				if (!relationCurrentToJunction.value.junction_field) return;

				if (isNew(item)) {
					editsAtStart.value = item;
					junctionRowPrimaryKey.value = '+';
					showDetailModal.value = true;
					initialValues.value = null;
					return;
				}

				initialValues.value = item;

				/**
				 * @NOTE: Keep in mind there's a case where the junction row doesn't exist yet, but
				 * the related item does (when selecting an existing item)
				 */

				const junctionPrimaryKey = junctionCollectionPrimaryKeyField.value.field;
				const junctionField = relationCurrentToJunction.value.junction_field;
				const relatedPrimaryKey = relatedCollectionPrimaryKeyField.value.field;

				junctionRowPrimaryKey.value = item[junctionPrimaryKey] || '+';
				relatedRowPrimaryKey.value = item[junctionField]?.[relatedPrimaryKey] || '+';
				editsAtStart.value = item['$stagedEdits'] || null;
				showDetailModal.value = true;
			}

			function cancelEdit() {
				editsAtStart.value = {};
				showDetailModal.value = false;
				junctionRowPrimaryKey.value = '+';
			}

			function stageEdits(edits: any) {
				if (!relationCurrentToJunction.value) return;
				if (!relationCurrentToJunction.value.junction_field) return;

				const junctionPrimaryKey = junctionCollectionPrimaryKeyField.value.field;
				const junctionField = relationCurrentToJunction.value.junction_field;
				const relatedPrimaryKey = relatedCollectionPrimaryKeyField.value.field;

				const currentValue = [...(props.value || [])];

				// If there weren't any previously made edits, it's safe to assume this change value
				// doesn't exist yet in the staged value
				if (!editsAtStart.value) {
					// If the item that we edited has any of the primary keys (junction/related), we
					// have to make sure we stage those as well. Otherwise the API will treat it as
					// a newly created item instead of updated existing
					if (junctionRowPrimaryKey.value !== '+') {
						set(edits, junctionPrimaryKey, junctionRowPrimaryKey.value);
					}

					if (relatedRowPrimaryKey.value !== '+') {
						set(edits, [junctionField, relatedPrimaryKey], relatedRowPrimaryKey.value);
					}

					emit('input', [...currentValue, edits]);
					reset();
					return;
				}

				const newValue = props.value.map((stagedValue: any) => {
					if (stagedValue === editsAtStart.value) return edits;
					return stagedValue;
				});

				emit('input', newValue);
				reset();

				function reset() {
					editsAtStart.value = null;
					showDetailModal.value = true;
					junctionRowPrimaryKey.value = '+';
					relatedRowPrimaryKey.value = '+';
				}
			}
		}

		/**
		 * Everything regarding the selection of existing related items.
		 */
		function useSelection() {
			const showBrowseModal = ref(false);

			const alreadySelectedRelatedPrimaryKeys = computed(() => {
				if (!relationCurrentToJunction.value) return [];
				if (!relationCurrentToJunction.value.junction_field) return [];

				const junctionField = relationCurrentToJunction.value.junction_field;
				const relatedPrimaryKey = relatedCollectionPrimaryKeyField.value.field;

				return previewItems.value
					.filter((previewItem: any) => previewItem[junctionField])
					.map((previewItem: any) => {
						if (
							typeof previewItem[junctionField] === 'string' ||
							typeof previewItem[junctionField] === 'number'
						) {
							return previewItem[junctionField];
						}

						return previewItem[junctionField][relatedPrimaryKey];
					})
					.filter((p) => p);
			});

			const selectionFilters = computed<Filter[]>(() => {
				const relatedPrimaryKey = relatedCollectionPrimaryKeyField.value.field;
				const filter: Filter = {
					key: 'selection',
					field: relatedPrimaryKey,
					operator: 'nin',
					value: alreadySelectedRelatedPrimaryKeys.value.join(','),
					locked: true,
				};

				return [filter];
			});

			return { showBrowseModal, stageSelection, selectionFilters };

			function stageSelection(selection: any) {
				const selectionAsJunctionRows = selection.map((relatedPrimaryKey: string | number) => {
					if (!relationCurrentToJunction.value) return;
					if (!relationCurrentToJunction.value.junction_field) return;

					const junctionField = relationCurrentToJunction.value.junction_field;
					const relatedPrimaryKeyField = relatedCollectionPrimaryKeyField.value.field;

					return {
						[junctionField]: {
							// Technically, "junctionField: primaryKey" should be enough for the api
							// to do it's thing for newly selected items. However, that would require
							// the previewItems check to be way more complex. This shouldn't introduce
							// too much overhead in the API, while drastically simplifying this interface
							[relatedPrimaryKeyField]: relatedPrimaryKey,
						},
					};
				});

				// Seeing the browse modal only shows items that haven't been selected yet (using the
				// filter above), we can safely assume that the items don't exist yet in props.value
				emit('input', [...(props.value || []), ...selectionAsJunctionRows]);
			}
		}

		/**
		 * Manages the state of the table. This includes the table headers, and the event handlers for
		 * the table events
		 */
		function useTable() {
			// Using a ref for the table headers here means that the table itself can update the
			// values if it needs to. This allows the user to manually resize the columns for example
			const tableHeaders = ref<TableHeader[]>([]);

			watch(() => props.fields, setHeaders);

			return { tableHeaders };

			function setHeaders() {
				if (!props.fields) return;

				tableHeaders.value = props.fields.map(
					(fieldKey): TableHeader => {
						const fieldInfo = fieldsStore.getField(junctionCollection.value, fieldKey);

						return {
							text: fieldInfo.name,
							value: fieldKey,
							align: 'left',
							sortable: true,
							width: null,
							field: fieldInfo,
						};
					}
				);
			}
		}

		function isNew(item: any) {
			if (!relationCurrentToJunction.value) return;
			if (!relationCurrentToJunction.value.junction_field) return;

			const junctionPrimaryKey = junctionCollectionPrimaryKeyField.value.field;
			const junctionField = relationCurrentToJunction.value.junction_field;
			const relatedPrimaryKey = relatedCollectionPrimaryKeyField.value.field;
			const hasPrimaryKey = !!item[junctionPrimaryKey];
			const hasRelatedPrimaryKey = !!item[junctionField]?.[relatedPrimaryKey];

			return hasPrimaryKey === false && hasRelatedPrimaryKey === false;
		}

		/**
		 * Deselect an item. This either means undoing any changes made (new item), or adding $delete: true
		 * if the junction row already exists.
		 */
		function deselect(junctionRow: any) {
			const primaryKey = junctionRow[junctionCollectionPrimaryKeyField.value.field];

			// If the junction row has a primary key, it's an existing item in the junction row, and
			// we want to add the $delete flag so the API can delete the row in the junction table,
			// effectively deselecting the related item from this item
			if (primaryKey) {
				// Once you deselect an item, it's removed from the preview table. You can only
				// deselect an item once, so we don't have to check if this item was already disabled
				emit('input', [
					...(props.value || []),
					{
						[junctionCollectionPrimaryKeyField.value.field]: primaryKey,
						$delete: true,
					},
				]);

				return;
			}

			// If the item doesn't exist yet, there must be a staged edit for it's creation, that's
			// the thing we want to filter out of the staged edits.
			emit(
				'input',
				props.value.filter((stagedValue) => {
					return stagedValue !== junctionRow && stagedValue !== junctionRow['$stagedEdits'];
				})
			);
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
