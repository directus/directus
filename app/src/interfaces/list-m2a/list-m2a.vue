<template>
	<div class="m2a-builder">
		<div v-if="previewLoading && !previewValues" class="loader">
			<v-skeleton-loader v-for="n in (value || []).length" :key="n" />
		</div>

		<v-list v-else>
			<v-notice v-if="previewValues.length === 0">
				{{ t('no_items') }}
			</v-notice>

			<draggable
				:force-fallback="true"
				:model-value="previewValues"
				item-key="$index"
				:set-data="hideDragImage"
				:disabled="!o2mRelation.meta || !o2mRelation.meta.sort_field"
				@update:model-value="onSort"
			>
				<template #item="{ element }">
					<v-list-item
						v-if="allowedCollections.includes(element[anyRelation.meta.one_collection_field])"
						block
						:dense="previewValues.length > 4"
						clickable
						@click="editExisting((value || [])[element.$index])"
					>
						<v-icon
							v-if="o2mRelation.meta && o2mRelation.meta.sort_field"
							class="drag-handle"
							left
							name="drag_handle"
							@click.stop
						/>
						<span class="collection">{{ collections[element[anyRelation.meta.one_collection_field]].name }}:</span>
						<span
							v-if="typeof element[anyRelation.field] === 'number' || typeof element[anyRelation.field] === 'string'"
						>
							{{ element[anyRelation.field] }}
						</span>
						<render-template
							v-else
							:collection="element[anyRelation.meta.one_collection_field]"
							:template="templates[element[anyRelation.meta.one_collection_field]]"
							:item="element[anyRelation.field]"
						/>
						<div class="spacer" />
						<v-icon
							v-if="!disabled"
							class="clear-icon"
							name="clear"
							@click.stop="deselect((value || [])[element.$index])"
						/>
					</v-list-item>

					<v-list-item v-else block>
						<v-icon class="invalid-icon" name="warning" left />
						<span>{{ t('invalid_item') }}</span>
						<div class="spacer" />
						<v-icon
							v-if="!disabled"
							class="clear-icon"
							name="clear"
							@click.stop="deselect((value || [])[element.$index])"
						/>
					</v-list-item>
				</template>
			</draggable>
		</v-list>

		<div v-if="!disabled" class="buttons">
			<v-menu v-if="enableCreate" show-arrow>
				<template #activator="{ toggle }">
					<v-button @click="toggle">
						{{ t('create_new') }}
						<v-icon name="arrow_drop_down" right />
					</v-button>
				</template>

				<v-list>
					<v-list-item
						v-for="availableCollection of collections"
						:key="availableCollection.collection"
						clickable
						@click="createNew(availableCollection.collection)"
					>
						<v-list-item-icon><v-icon :name="availableCollection.icon" /></v-list-item-icon>
						<v-text-overflow :text="availableCollection.name" />
					</v-list-item>
				</v-list>
			</v-menu>

			<v-menu v-if="enableSelect" show-arrow>
				<template #activator="{ toggle }">
					<v-button class="existing" @click="toggle">
						{{ t('add_existing') }}
						<v-icon name="arrow_drop_down" right />
					</v-button>
				</template>

				<v-list>
					<v-list-item
						v-for="availableCollection of collections"
						:key="availableCollection.collection"
						clickable
						@click="selectingFrom = availableCollection.collection"
					>
						<v-list-item-icon><v-icon :name="availableCollection.icon" /></v-list-item-icon>
						<v-text-overflow :text="availableCollection.name" />
					</v-list-item>
				</v-list>
			</v-menu>
		</div>

		<drawer-collection
			v-if="!disabled && !!selectingFrom"
			multiple
			:active="!!selectingFrom"
			:collection="selectingFrom"
			:selection="[]"
			@input="stageSelection"
			@update:active="selectingFrom = null"
		/>

		<drawer-item
			v-if="!disabled"
			:active="!!currentlyEditing"
			:collection="o2mRelation.collection"
			:primary-key="currentlyEditing || '+'"
			:related-primary-key="relatedPrimaryKey || '+'"
			:junction-field="o2mRelation.meta.junction_field"
			:edits="editsAtStart"
			:circular-field="o2mRelation.field"
			@input="stageEdits"
			@update:active="cancelEdit"
		/>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, PropType, ref, watch } from 'vue';
import { useRelationsStore, useCollectionsStore, useFieldsStore } from '@/stores';
import { Relation } from '@directus/shared/types';
import { Collection } from '@/types';
import DrawerCollection from '@/views/private/components/drawer-collection/';
import DrawerItem from '@/views/private/components/drawer-item/';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { getFieldsFromTemplate } from '@directus/shared/utils';
import { isPlainObject, cloneDeep, isEqual } from 'lodash';
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
			type: Array as PropType<any[] | null>,
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
		enableCreate: {
			type: Boolean,
			default: true,
		},
		enableSelect: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const relationsStore = useRelationsStore();
		const fieldsStore = useFieldsStore();
		const collectionsStore = useCollectionsStore();

		const { o2mRelation, anyRelation, allowedCollections, o2mRelationPrimaryKeyField } = useRelations();
		const { fetchValues, previewValues, loading: previewLoading, junctionRowMap, relatedItemValues } = useValues();
		const { collections, templates, primaryKeys } = useCollections();
		const { selectingFrom, stageSelection, deselect } = useSelection();
		const { currentlyEditing, relatedPrimaryKey, editsAtStart, stageEdits, cancelEdit, editExisting, createNew } =
			useEdits();
		const { onSort } = useManualSort();

		watch(() => props.value, fetchValues, { immediate: true, deep: true });

		return {
			t,
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
			allowedCollections,
		};

		function useRelations() {
			const relationsForField = computed<Relation[]>(() => {
				return relationsStore.getRelationsForField(props.collection, props.field);
			});

			const o2mRelation = computed(
				() => relationsForField.value.find((relation) => relation.related_collection !== null)!
			);
			const anyRelation = computed(
				() => relationsForField.value.find((relation) => relation.related_collection === null)!
			);

			const o2mRelationPrimaryKeyField = computed<string>(() => {
				return fieldsStore.getPrimaryKeyFieldForCollection(o2mRelation.value.collection).field;
			});

			const allowedCollections = computed(() => anyRelation.value.meta!.one_allowed_collections!);

			return { relationsForField, o2mRelation, anyRelation, allowedCollections, o2mRelationPrimaryKeyField };
		}

		function useCollections() {
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
						const junctionKey = isPlainObject(val) ? val[o2mRelationPrimaryKeyField.value] : val;

						const savedValues = (junctionRowMap.value || []).find(
							(junctionRow) => junctionRow[o2mRelationPrimaryKeyField.value] === junctionKey
						);

						if (isPlainObject(val)) {
							return {
								...savedValues,
								...val,
								$index: index,
							};
						} else {
							if (savedValues === undefined) {
								return null;
							}

							return {
								...savedValues,
								$index: index,
							};
						}
					})
					.filter((val) => val)
					.map((val) => {
						// Find and nest the related item values for use in the preview
						const collection = val[anyRelation.value.meta!.one_collection_field!];

						const key = isPlainObject(val[anyRelation.value.field])
							? val[anyRelation.value.field][primaryKeys.value[collection]]
							: val[anyRelation.value.field];

						const item = relatedItemValues.value[collection]?.find(
							(item) => item[primaryKeys.value[collection]] == key
						);

						// When this item is created new and it has a uuid / auto increment id, there's no key to lookup
						if (key && item) {
							if (isPlainObject(val[anyRelation.value.field])) {
								val[anyRelation.value.field] = {
									...item,
									...val[anyRelation.value.field],
								};
							} else {
								val[anyRelation.value.field] = cloneDeep(item);
							}
						}

						return val;
					});

				if (o2mRelation.value?.meta?.sort_field) {
					return [
						...values
							.filter((val) => o2mRelation.value.meta!.sort_field! in val)
							.sort((a, b) => a[o2mRelation.value.meta!.sort_field!] - b[o2mRelation.value.meta!.sort_field!]), // sort by sort field if it exists
						...values
							.filter((val) => o2mRelation.value.meta!.sort_field! in val === false)
							.sort((a, b) => a.$index - b.$index), // sort the rest with $index
					];
				} else {
					return [...values.sort((a, b) => a.$index - b.$index)];
				}
			});

			return {
				fetchValues,
				previewValues,
				loading,
				junctionRowMap,
				relatedItemValues,
			};

			async function fetchValues(newVal: any, oldVal: any) {
				if (props.value === null) return;

				if (isEqual(newVal, oldVal)) return;

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
						else if (anyRelation.value.meta!.one_collection_field! in stagedValue === false) {
							junctionRowsToInspect.push(stagedValue[o2mRelationPrimaryKeyField.value]);
						}

						// Otherwise, it's an object with the edits on an existing item, or a newly added item
						// In both cases, it'll have the "one_collection_field" set. Both theoretically can have a primary key
						// though the primary key could be a newly created one
						else {
							const relatedCollection = stagedValue[anyRelation.value.meta!.one_collection_field!];
							const relatedCollectionPrimaryKey = primaryKeys.value[relatedCollection];

							// stagedValue could contain the primary key as a primitive in field or nested as primaryKeyField
							// in an object
							const relatedKey = isPlainObject(stagedValue[anyRelation.value.field])
								? stagedValue[anyRelation.value.field][relatedCollectionPrimaryKey]
								: stagedValue[anyRelation.value.field];

							// Could be that the key doesn't exist (add new item without manual primary key)
							if (relatedKey) {
								itemsToFetchPerCollection[relatedCollection].push(relatedKey);
							}
						}
					}

					// If there's junction row IDs, we'll have to fetch the related collection / key from them in order to fetch
					// the correct data from those related collections
					if (junctionRowsToInspect.length > 0) {
						const junctionInfoResponse = await api.get(`/items/${o2mRelation.value.collection}`, {
							params: {
								filter: {
									[o2mRelationPrimaryKeyField.value]: {
										_in: junctionRowsToInspect,
									},
								},
								fields: [
									o2mRelationPrimaryKeyField.value,
									anyRelation.value.field,
									anyRelation.value.meta!.one_collection_field!,
									o2mRelation.value.meta?.sort_field,
								],
							},
						});

						for (const junctionRow of junctionInfoResponse.data.data) {
							const relatedCollection = junctionRow[anyRelation.value.meta!.one_collection_field!];

							// When the collection exists in the setup
							if (relatedCollection in itemsToFetchPerCollection) {
								itemsToFetchPerCollection[relatedCollection].push(junctionRow[anyRelation.value.field]);
							}
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
				} catch (err: any) {
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
				const { field } = anyRelation.value;
				const oneCollectionField = anyRelation.value.meta!.one_collection_field!;

				const currentValue = props.value || [];

				const selectionAsJunctionRows = selection.map((key) => {
					return {
						[oneCollectionField]: selectingFrom.value,
						[field]: key,
					};
				});

				emit('input', [...currentValue, ...selectionAsJunctionRows]);
			}

			function deselect(item: any) {
				const newValue = (props.value || []).filter((current) => current !== item);

				if (newValue.length === 0) {
					emit('input', null);
				} else {
					emit('input', newValue);
				}
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
						return row[o2mRelationPrimaryKeyField.value] == item;
					});

					const collection = junctionRow[anyRelation.value.meta!.one_collection_field!];
					const relatedKey = isPlainObject(junctionRow[anyRelation.value.field])
						? junctionRow[anyRelation.value.field][primaryKeys.value[collection]]
						: junctionRow[anyRelation.value.field];

					editsAtStart.value = {
						[o2mRelationPrimaryKeyField.value]: item,
						[anyRelation.value.meta!.one_collection_field!]: collection,
						[anyRelation.value.field]: {
							[primaryKeys.value[collection]]: relatedKey,
						},
					};

					if (o2mRelation.value.meta?.sort_field) {
						editsAtStart.value[o2mRelation.value.meta?.sort_field] = junctionRow[o2mRelation.value.meta?.sort_field];
					}

					relatedPrimaryKey.value = relatedKey || '+';
					currentlyEditing.value = item;
					return;
				}

				const junctionPrimaryKey = item[o2mRelationPrimaryKeyField.value];
				const relatedCollectiom = item[anyRelation.value.meta!.one_collection_field!];
				let relatedKey = item[anyRelation.value.field];

				if (isPlainObject(relatedKey)) {
					relatedKey = item[anyRelation.value.field][primaryKeys.value[relatedCollectiom]];
				}

				editsAtStart.value = item;
				relatedPrimaryKey.value = relatedKey || '+';
				currentlyEditing.value = junctionPrimaryKey || '+';
			}

			function createNew(collection: string) {
				const newItem = {
					[anyRelation.value.meta!.one_collection_field!]: collection,
					[anyRelation.value.field]: {},
				};

				if (previewValues.value && o2mRelation.value?.meta?.sort_field) {
					const maxSort = Math.max(-1, ...previewValues.value.map((val) => val[o2mRelation.value.meta!.sort_field!]));
					newItem[o2mRelation.value.meta!.sort_field!] = maxSort + 1;
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
						if (!o2mRelation.value.meta?.sort_field) return rawValue;

						const sortedItemIndex = sortedItems.findIndex((sortedItem) => {
							return sortedItem.$index === index;
						});

						if (isPlainObject(rawValue)) {
							return {
								...rawValue,
								[o2mRelation.value.meta?.sort_field]: sortedItemIndex + 1,
							};
						} else {
							return {
								...sortedItems[sortedItemIndex],
								[o2mRelationPrimaryKeyField.value]: rawValue,
								[o2mRelation.value.meta?.sort_field]: sortedItemIndex + 1,
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
.v-list {
	--v-list-padding: 0 0 4px;
}

.v-list-item {
	.collection {
		color: var(--primary);
		white-space: nowrap;
		margin-right: 1ch;
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
	margin-top: 8px;
}

.existing {
	margin-left: 8px;
}

.drag-handle {
	cursor: grab;
}

.invalid {
	cursor: default;

	.invalid-icon {
		--v-icon-color: var(--danger);
	}
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
