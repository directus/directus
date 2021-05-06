<template>
	<v-notice type="warning" v-if="!relation">
		{{ $t('relationship_not_setup') }}
	</v-notice>
	<div class="one-to-many" v-else>
		<template v-if="loading">
			<v-skeleton-loader
				v-for="n in (value || []).length || 3"
				:key="n"
				:type="(value || []).length > 4 ? 'block-list-item-dense' : 'block-list-item'"
			/>
		</template>

		<v-notice v-else-if="sortedItems.length === 0">
			{{ $t('no_items') }}
		</v-notice>

		<v-list v-else>
			<draggable
				:force-fallback="true"
				:value="sortedItems"
				@input="sortItems($event)"
				handler=".drag-handle"
				:disabled="!relation.sort_field"
			>
				<v-list-item
					:dense="sortedItems.length > 4"
					v-for="item in sortedItems"
					:key="item.id"
					block
					:disabled="disabled || updateAllowed === false"
					@click="editItem(item)"
				>
					<v-icon v-if="relation.sort_field" name="drag_handle" class="drag-handle" left @click.stop="() => {}" />
					<render-template :collection="relation.many_collection" :item="item" :template="templateWithDefaults" />
					<div class="spacer" />
					<v-icon v-if="!disabled && updateAllowed" name="close" @click.stop="deleteItem(item)" />
				</v-list-item>
			</draggable>
		</v-list>

		<div class="actions" v-if="!disabled">
			<v-button v-if="enableCreate && createAllowed && updateAllowed" @click="currentlyEditing = '+'">
				{{ $t('create_new') }}
			</v-button>
			<v-button v-if="enableSelect && updateAllowed" @click="selectModalActive = true">
				{{ $t('add_existing') }}
			</v-button>
		</div>

		<drawer-item
			v-if="!disabled"
			:active="currentlyEditing !== null"
			:collection="relatedCollection.collection"
			:primary-key="currentlyEditing || '+'"
			:edits="editsAtStart"
			:circular-field="relation.many_field"
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
import { useCollectionsStore, useRelationsStore, useFieldsStore, usePermissionsStore, useUserStore } from '@/stores/';
import DrawerItem from '@/views/private/components/drawer-item';
import DrawerCollection from '@/views/private/components/drawer-collection';
import { Filter, Field } from '@/types';
import { isEqual, sortBy } from 'lodash';
import { get } from 'lodash';
import { unexpectedError } from '@/utils/unexpected-error';
import { getFieldsFromTemplate } from '@/utils/get-fields-from-template';
import Draggable from 'vuedraggable';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';

export default defineComponent({
	components: { DrawerItem, DrawerCollection, Draggable },
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
		template: {
			type: String,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
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
	setup(props, { emit }) {
		const relationsStore = useRelationsStore();
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();
		const permissionsStore = usePermissionsStore();
		const userStore = useUserStore();

		const { relation, relatedCollection, relatedPrimaryKeyField } = useRelation();

		const templateWithDefaults = computed(
			() => props.template || relatedCollection.value.meta?.display_template || `{{${relation.value.many_primary}}}`
		);

		const fields = computed(() =>
			adjustFieldsForDisplays(getFieldsFromTemplate(templateWithDefaults.value), relatedCollection.value.collection)
		);

		const { items, loading } = usePreview();
		const { currentlyEditing, editItem, editsAtStart, stageEdits, cancelEdit } = useEdits();
		const { stageSelection, selectModalActive, selectionFilters } = useSelection();
		const { sort, sortItems, sortedItems } = useSort();

		const { createAllowed, updateAllowed } = usePermissions();

		return {
			relation,
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
			getItemFromIndex,
			templateWithDefaults,
			createAllowed,
			updateAllowed,
		};

		function getItemFromIndex(index: number) {
			return (sortedItems.value || items.value)[index];
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
			const sort = ref({ by: relation.value.sort_field || fields.value[0], desc: false });

			function sortItems(newItems: Record<string, any>[]) {
				if (relation.value.sort_field === null) return;

				const itemsSorted = newItems.map((item, i) => {
					item[relation.value.sort_field] = i;
					return item;
				});

				emit('input', itemsSorted);
			}

			const sortedItems = computed(() => {
				if (relation.value.sort_field === null || sort.value.by !== relation.value.sort_field) return items.value;

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

		function usePreview() {
			const loading = ref(false);
			const items = ref<Record<string, any>[]>([]);

			watch(
				() => props.value,
				async () => {
					loading.value = true;
					const pkField = relatedPrimaryKeyField.value.field;

					const fieldsList = [...(fields.value.length > 0 ? fields.value : getDefaultFields())];

					if (fieldsList.includes(pkField) === false) {
						fieldsList.push(pkField);
					}

					if (relation.value.sort_field !== null && fieldsList.includes(relation.value.sort_field) === false)
						fieldsList.push(relation.value.sort_field);

					try {
						const endpoint = relatedCollection.value.collection.startsWith('directus_')
							? `/${relatedCollection.value.collection.substring(9)}`
							: `/items/${relatedCollection.value.collection}`;

						const primaryKeys = getPrimaryKeys();

						let existingItems: any[] = [];

						if (primaryKeys && primaryKeys.length > 0) {
							const response = await api.get(endpoint, {
								params: {
									fields: fieldsList,
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

			return { items, loading };
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

				const edits = (props.value || []).find(
					(edit: any) =>
						typeof edit === 'object' &&
						edit[relatedPrimaryKeyField.value.field] === item[relatedPrimaryKeyField.value.field]
				);

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

		function usePermissions() {
			const createAllowed = computed(() => {
				const admin = userStore.state?.currentUser?.role.admin_access === true;
				if (admin) return true;

				return !!permissionsStore.state.permissions.find(
					(permission) => permission.action === 'create' && permission.collection === relatedCollection.value.collection
				);
			});

			const updateAllowed = computed(() => {
				const admin = userStore.state?.currentUser?.role.admin_access === true;
				if (admin) return true;

				return !!permissionsStore.state.permissions.find(
					(permission) => permission.action === 'update' && permission.collection === relatedCollection.value.collection
				);
			});

			return { createAllowed, updateAllowed };
		}
	},
});
</script>

<style lang="scss" scoped>
.v-list {
	--v-list-padding: 0 0 4px;
}

.actions {
	margin-top: 8px;

	.v-button + .v-button {
		margin-left: 8px;
	}
}

.deselect {
	--v-icon-color: var(--foreground-subdued);

	&:hover {
		--v-icon-color: var(--danger);
	}
}
</style>
