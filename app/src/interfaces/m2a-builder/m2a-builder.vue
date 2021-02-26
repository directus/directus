<template>
	<div class="m2a-builder">
		<div v-if="previewLoading && !previewValues" class="loader">
			<v-skeleton-loader v-for="n in (value || []).length" :key="n" />
		</div>

		<draggable
			v-else
			:value="previewValues"
			handle=".drag-handle"
			@input="onSort"
			:set-data="hideDragImage"
			:disabled="!o2mRelation.sort_field"
		>
			<div
				class="m2a-row"
				v-for="item of previewValues"
				:key="item.$index"
				@click="editExisting((value || [])[item.$index])"
			>
				<v-icon class="drag-handle" name="drag_handle" @click.stop v-if="o2mRelation.sort_field" />
				<span class="collection">{{ collections[item[anyRelation.one_collection_field]].name }}:</span>
				<span
					v-if="typeof item[anyRelation.many_field] === 'number' || typeof item[anyRelation.many_field] === 'string'"
				>
					{{ item[anyRelation.many_field] }}
				</span>
				<render-template
					v-else
					:collection="item[anyRelation.one_collection_field]"
					:template="templates[item[anyRelation.one_collection_field]]"
					:item="item[anyRelation.many_field]"
				/>
				<div class="spacer" />
				<v-icon class="clear-icon" name="clear" @click.stop="deselect((value || [])[item.$index])" />
				<v-icon class="launch-icon" name="launch" />
			</div>
		</draggable>

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
						<v-text-overflow :text="collection.name" />
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
						<v-text-overflow :text="collection.name" />
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
			:edits="editsAtStart"
			@input="stageEdits"
			@update:active="cancelEdit"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, ref, watch } from '@vue/composition-api';
import { useRelationsStore, useCollectionsStore, useFieldsStore } from '@/stores';
import { Relation, Collection } from '@/types/';
import DrawerCollection from '@/views/private/components/drawer-collection/';
import DrawerItem from '@/views/private/components/drawer-item/';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { getFieldsFromTemplate } from '@/utils/get-fields-from-template';
import { isPlainObject, cloneDeep } from 'lodash';
import { getEndpoint } from '@/utils/get-endpoint';
import { hideDragImage } from '@/utils/hide-drag-image';
import Draggable from 'vuedraggable';

export default defineComponent({
	components: { DrawerCollection, DrawerItem, Draggable },
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
		const { collections, templates, primaryKeys } = useCollections();
		const { fetchValues, previewValues, loading: previewLoading, junctionRowMap, relatedItemValues } = useValues();
		const { selectingFrom, stageSelection, deselect } = useSelection();
		const {
			currentlyEditing,
			relatedPrimaryKey,
			editsAtStart,
			stageEdits,
			cancelEdit,
			editExisting,
			createNew,
		} = useEdits();
		const { onSort } = useManualSort();

		watch(props, fetchValues, { immediate: true, deep: true });

		return {
			previewValues,
			collections,
			selectingFrom,
			stageSelection,
			templates,
			o2mRelation,
			anyRelation,
			currentlyEditing,
			relatedPrimaryKey,
			editsAtStart,
			stageEdits,
			cancelEdit,
			editExisting,
			createNew,
			previewLoading,
			deselect,
			relatedItemValues,
			hideDragImage,
			onSort,
		};

		function useRelations() {
			const relationsForField = computed<Relation[]>(() => {
				return relationsStore.getRelationsForField(props.collection, props.field);
			});

			const o2mRelation = computed(() => relationsForField.value.find((relation) => relation.one_collection !== null)!);
			const anyRelation = computed(() => relationsForField.value.find((relation) => relation.one_collection === null)!);

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

			const primaryKeys = computed(() => {
				const keys: Record<string, string> = {};

				for (const collection of Object.values(collections.value)) {
					keys[collection.collection] = fieldsStore.getPrimaryKeyFieldForCollection(collection.collection).field!;
				}

				return keys;
			});

			const templates = computed(() => {
				const templates: Record<string, string> = {};

				for (const collection of Object.values(collections.value)) {
					const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(collection.collection);
					templates[collection.collection] = collection.meta?.display_template || `{{${primaryKeyField.field}}}`;
				}

				return templates;
			});

			return { collections, primaryKeys, templates };
		}

		function useValues() {
			const loading = ref(false);
			const relatedItemValues = ref<Record<string, any[]>>({});

			// Holds "expanded" junction rows so we can lookup what "raw" junction row ID in props.value goes with
			// what related item for pre-saved-unchanged-items
			const junctionRowMap = ref<any[]>();

			const previewValues = computed(() => {
				// Need to wait until junctionRowMap got properly populated
				if (junctionRowMap.value === undefined) {
					return [];
				}

				// Convert all string/number junction rows into junction row records from the map so we can inject the
				// related values
				const values = cloneDeep(props.value || [])
					.map((val, index) => {
						const junctionKey = isPlainObject(val) ? val[o2mRelation.value.many_primary] : val;

						const savedValues = (junctionRowMap.value || []).find(
							(junctionRow) => junctionRow[o2mRelation.value.many_primary] === junctionKey
						);

						if (isPlainObject(val)) {
							return {
								...savedValues,
								...val,
								$index: index,
							};
						} else {
							return {
								...savedValues,
								$index: index,
							};
						}
					})
					.map((val) => {
						// Find and nest the related item values for use in the preview
						const collection = val[anyRelation.value.one_collection_field!];

						const key = isPlainObject(val[anyRelation.value.many_field])
							? val[anyRelation.value.many_field][primaryKeys.value[collection]]
							: val[anyRelation.value.many_field];

						const item = relatedItemValues.value[collection]?.find(
							(item) => item[primaryKeys.value[collection]] == key
						);

						// When this item is created new and it has a uuid / auto increment id, there's no key to lookup
						if (key && item) {
							if (isPlainObject(val[anyRelation.value.many_field])) {
								val[anyRelation.value.many_field] = {
									...item,
									...val[anyRelation.value.many_field],
								};
							} else {
								val[anyRelation.value.many_field] = cloneDeep(item);
							}
						}

						return val;
					});

				if (o2mRelation.value?.sort_field) {
					return [
						...values
							.filter((val) => val.hasOwnProperty(o2mRelation.value.sort_field!))
							.sort((a, b) => a[o2mRelation.value.sort_field!] - b[o2mRelation.value.sort_field!]), // sort by sort field if it exists
						...values
							.filter((val) => !val.hasOwnProperty(o2mRelation.value.sort_field!))
							.sort((a, b) => a.$index - b.$index), // sort the rest with $index
					];
				} else {
					return [...values.sort((a, b) => a.$index - b.$index)];
				}
			});

			return { fetchValues, previewValues, loading, junctionRowMap, relatedItemValues };

			async function fetchValues() {
				if (props.value === null) return;

				loading.value = true;

				try {
					// When we only know the ID of the junction row, we'll have to retrieve those rows to get to the related
					// item primary key
					const junctionRowsToInspect: (string | number)[] = [];

					// We want to fetch the minimal data needed to render the preview rows from the source collections
					// These will be the IDs per related collection in the m2a that have to be read
					const itemsToFetchPerCollection: Record<string, (string | number)[]> = {};

					for (const collection of Object.values(collections.value)) {
						itemsToFetchPerCollection[collection.collection] = [];
					}

					// Reminder: props.value holds junction table rows/ids
					for (const stagedValue of props.value || []) {
						// If the staged value is a primitive string or number, it's the ID of the junction row
						// In that case, we have to fetch the row in order to get the info we need on the related item
						if (typeof stagedValue === 'string' || typeof stagedValue === 'number') {
							junctionRowsToInspect.push(stagedValue);
						}

						// There's a case where you sort with no other changes where the one_collection_field doesn't exist
						// and there's no further changes nested in the many field
						else if (anyRelation.value.one_collection_field! in stagedValue === false) {
							junctionRowsToInspect.push(stagedValue[o2mRelation.value.many_primary]);
						}

						// Otherwise, it's an object with the edits on an existing item, or a newly added item
						// In both cases, it'll have the "one_collection_field" set. Both theoretically can have a primary key
						// though the primary key could be a newly created one
						else {
							const relatedCollection = stagedValue[anyRelation.value.one_collection_field!];
							const relatedCollectionPrimaryKey = primaryKeys.value[relatedCollection];

							// stagedValue could contain the primary key as a primitive in many_field or nested as primaryKeyField
							// in an object
							const relatedKey = isPlainObject(stagedValue[anyRelation.value.many_field])
								? stagedValue[anyRelation.value.many_field][relatedCollectionPrimaryKey]
								: stagedValue[anyRelation.value.many_field];

							// Could be that the key doesn't exist (add new item without manual primary key)
							if (relatedKey) {
								itemsToFetchPerCollection[relatedCollection].push(relatedKey);
							}
						}
					}

					// If there's junction row IDs, we'll have to fetch the related collection / key from them in order to fetch
					// the correct data from those related collections
					if (junctionRowsToInspect.length > 0) {
						const junctionInfoResponse = await api.get(`/items/${o2mRelation.value.many_collection}`, {
							params: {
								filter: {
									[o2mRelation.value.many_primary]: {
										_in: junctionRowsToInspect,
									},
								},
								fields: [
									o2mRelation.value.many_primary,
									anyRelation.value.many_field,
									anyRelation.value.one_collection_field!,
									o2mRelation.value.sort_field,
								],
							},
						});

						for (const junctionRow of junctionInfoResponse.data.data) {
							itemsToFetchPerCollection[junctionRow[anyRelation.value.one_collection_field!]].push(
								junctionRow[anyRelation.value.many_field]
							);
						}

						junctionRowMap.value = junctionInfoResponse.data.data;
					} else {
						junctionRowMap.value = [];
					}

					// Fetch all related items from their individual endpoints using the fields from their templates
					const responses = await Promise.all(
						Object.entries(itemsToFetchPerCollection).map(([collection, relatedKeys]) => {
							// Don't attempt fetching anything if there's no keys to fetch
							if (relatedKeys.length === 0) return Promise.resolve({ data: { data: [] } } as any);

							const fields = getFieldsFromTemplate(templates.value[collection]);

							// Make sure to always fetch the primary key, so we can match that with the value
							if (fields.includes(primaryKeys.value[collection]) === false) fields.push(primaryKeys.value[collection]);

							return api.get(getEndpoint(collection), {
								params: {
									filter: {
										[primaryKeys.value[collection]]: {
											_in: relatedKeys,
										},
									},
									fields,
								},
							});
						})
					);

					if (!relatedItemValues.value) relatedItemValues.value = {};

					for (let i = 0; i < Object.keys(itemsToFetchPerCollection).length; i++) {
						const collection = Object.keys(itemsToFetchPerCollection)[i];

						relatedItemValues.value = {
							...relatedItemValues.value,
							[collection]: responses[i].data.data,
						};
					}
				} catch (err) {
					unexpectedError(err);
				} finally {
					loading.value = false;
				}
			}
		}

		function useSelection() {
			const selectingFrom = ref<string | null>(null);

			return { selectingFrom, stageSelection, deselect };

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

			function deselect(item: any) {
				emit(
					'input',
					(props.value || []).filter((current) => current !== item)
				);
			}
		}

		function useEdits() {
			const currentlyEditing = ref<string | number | null>(null);
			const relatedPrimaryKey = ref<string | number | null>(null);
			const editsAtStart = ref<Record<string, any>>({});

			return {
				currentlyEditing,
				relatedPrimaryKey,
				editsAtStart,
				stageEdits,
				cancelEdit,
				editExisting,
				createNew,
			};

			function stageEdits(edits: Record<string, any>) {
				const currentValue = props.value || [];

				// Whether or not the currently-being-edited item exists in the staged values
				const hasBeenStaged =
					currentValue.includes(editsAtStart.value) || currentValue.includes(currentlyEditing.value);

				// Whether or not the currently-being-edited item has been saved to the database
				const isNew = currentlyEditing.value === '+' && relatedPrimaryKey.value === '+';

				if (isNew && hasBeenStaged === false) {
					emit('input', [...currentValue, edits]);
				} else {
					emit(
						'input',
						currentValue.map((val) => {
							if (val === editsAtStart.value || val == currentlyEditing.value) {
								return edits;
							}
							return val;
						})
					);
				}
			}

			function cancelEdit() {
				currentlyEditing.value = null;
				relatedPrimaryKey.value = null;
				editsAtStart.value = {};
			}

			function editExisting(item: Record<string, any>) {
				// Edit a saved item
				if (typeof item === 'string' || typeof item === 'number') {
					const junctionRow = (junctionRowMap.value || []).find((row) => {
						return row[o2mRelation.value.many_primary] == item;
					});

					const collection = junctionRow[anyRelation.value.one_collection_field!];
					const relatedKey = isPlainObject(junctionRow[anyRelation.value.many_field])
						? junctionRow[anyRelation.value.many_field][primaryKeys.value[collection]]
						: junctionRow[anyRelation.value.many_field];

					editsAtStart.value = {
						[o2mRelation.value.many_primary]: item,
						[anyRelation.value.one_collection_field!]: collection,
						[anyRelation.value.many_field]: {
							[primaryKeys.value[collection]]: relatedKey,
						},
					};

					if (o2mRelation.value.sort_field) {
						editsAtStart.value[o2mRelation.value.sort_field] = junctionRow[o2mRelation.value.sort_field];
					}

					relatedPrimaryKey.value = relatedKey || '+';
					currentlyEditing.value = item;
					return;
				}

				const junctionPrimaryKey = item[o2mRelation.value.many_primary];
				const relatedCollectiom = item[anyRelation.value.one_collection_field!];
				let relatedKey = item[anyRelation.value.many_field];

				if (isPlainObject(relatedKey)) {
					relatedKey = item[anyRelation.value.many_field][primaryKeys.value[relatedCollectiom]];
				}

				editsAtStart.value = item;
				relatedPrimaryKey.value = relatedKey || '+';
				currentlyEditing.value = junctionPrimaryKey || '+';
			}

			function createNew(collection: string) {
				const newItem = {
					[anyRelation.value.one_collection_field!]: collection,
					[anyRelation.value.many_field]: {},
				};

				if (previewValues.value && o2mRelation.value?.sort_field) {
					const maxSort = Math.max(-1, ...previewValues.value.map((val) => val[o2mRelation.value.sort_field!]));
					newItem[o2mRelation.value.sort_field!] = maxSort + 1;
				}

				editsAtStart.value = newItem;
				relatedPrimaryKey.value = '+';
				currentlyEditing.value = '+';
			}
		}

		function useManualSort() {
			return { onSort };

			function onSort(sortedItems: any[]) {
				emit(
					'input',
					props.value.map((rawValue, index) => {
						if (!o2mRelation.value.sort_field) return rawValue;

						const sortedItemIndex = sortedItems.findIndex((sortedItem) => {
							return sortedItem.$index === index;
						});

						if (isPlainObject(rawValue)) {
							return {
								...rawValue,
								[o2mRelation.value.sort_field]: sortedItemIndex + 1,
							};
						} else {
							return {
								[o2mRelation.value.many_primary]: rawValue,
								[o2mRelation.value.sort_field]: sortedItemIndex + 1,
							};
						}
					})
				);
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.m2a-row {
	display: flex;
	align-items: center;
	padding: 12px;
	background-color: var(--background-subdued);
	border: 2px solid var(--border-subdued);
	border-radius: var(--border-radius);
	cursor: pointer;

	& + .m2a-row {
		margin-top: 12px;
	}

	.collection {
		margin-right: 1ch;
		color: var(--primary);
	}
}

.loader {
	.v-skeleton-loader {
		height: 52px;
	}

	.v-skeleton-loader + .v-skeleton-loader {
		margin-top: 12px;
	}
}

.buttons {
	display: grid;
	grid-gap: var(--form-horizontal-gap);
	grid-template-columns: 1fr 1fr;
	margin-top: 12px;
}

.spacer {
	flex-grow: 1;
}

.drag-handle {
	margin-right: 8px;
	cursor: grab !important;
}

.clear-icon {
	--v-icon-color: var(--foreground-subdued);
	--v-icon-color-hover: var(--danger);

	margin-right: 8px;
	color: var(--foreground-subdued);
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--danger);
	}
}

.launch-icon {
	color: var(--foreground-subdued);
}
</style>
