<template>
	<v-notice v-if="!relation" type="warning">
		{{ t('relationship_not_setup') }}
	</v-notice>
	<div v-else class="one-to-many">
		<template v-if="loading">
			<v-skeleton-loader
				v-for="n in (value || []).length || 3"
				:key="n"
				:type="(value || []).length > 4 ? 'block-list-item-dense' : 'block-list-item'"
			/>
		</template>

		<v-notice v-else-if="sortedItems.length === 0">
			{{ t('no_items') }}
		</v-notice>

		<v-list v-else>
			<draggable
				:force-fallback="true"
				:model-value="sortedItems"
				item-key="id"
				handle=".drag-handle"
				:disabled="!allowDrag"
				@update:model-value="sortItems($event)"
			>
				<template #item="{ element, index }">
					<v-list-item
						:dense="sortedItems.length > 4"
						block
						clickable
						:disabled="disabled || updateAllowed === false"
						@click="editItem(element, index)"
					>
						<v-icon v-if="allowDrag" name="drag_handle" class="drag-handle" left @click.stop="() => {}" />
						<render-template :collection="relation.collection" :item="element" :template="templateWithDefaults" />
						<div class="spacer" />
						<v-icon v-if="!disabled && updateAllowed" name="close" @click.stop="deleteItem(element)" />
					</v-list-item>
				</template>
			</draggable>
		</v-list>

		<div v-if="!disabled" class="actions">
			<v-button v-if="enableCreate && createAllowed && updateAllowed" @click="currentlyEditing = '+'">
				{{ t('create_new') }}
			</v-button>
			<v-button v-if="enableSelect && updateAllowed" @click="selectModalActive = true">
				{{ t('add_existing') }}
			</v-button>
		</div>

		<drawer-item
			v-if="!disabled"
			:active="currentlyEditing !== null"
			:collection="relatedCollection.collection"
			:primary-key="currentlyEditing || '+'"
			:edits="editsAtStart"
			:circular-field="relation.field"
			@input="stageEdits"
			@update:active="cancelEdit"
		/>

		<drawer-collection
			v-if="!disabled"
			v-model:active="selectModalActive"
			:collection="relatedCollection.collection"
			:selection="selectedPrimaryKeys"
			:filter="customFilter"
			multiple
			@input="stageSelections"
		/>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, computed, watch, PropType, inject } from 'vue';
import api from '@/api';
import { useCollection } from '@directus/shared/composables';
import { useCollectionsStore, useRelationsStore, useFieldsStore, usePermissionsStore, useUserStore } from '@/stores/';
import DrawerItem from '@/views/private/components/drawer-item';
import DrawerCollection from '@/views/private/components/drawer-collection';
import { Field, Relation } from '@directus/shared/types';
import { get, isEqual, sortBy } from 'lodash';
import { unexpectedError } from '@/utils/unexpected-error';
import { getFieldsFromTemplate } from '@directus/shared/utils';
import { addRelatedPrimaryKeyToFields } from '@/utils/add-related-primary-key-to-fields';
import Draggable from 'vuedraggable';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import { Filter } from '@directus/shared/types';
import { parseFilter } from '@/utils/parse-filter';
import { render } from 'micromustache';
import { deepMap } from '@directus/shared/utils';

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
		filter: {
			type: Object as PropType<Filter>,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const values = inject('values', ref<Record<string, any>>({}));

		const customFilter = computed(() => {
			return parseFilter(
				deepMap(props.filter, (val: any) => {
					if (val && typeof val === 'string') {
						return render(val, values.value);
					}

					return val;
				})
			);
		});

		const relationsStore = useRelationsStore();
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();
		const permissionsStore = usePermissionsStore();
		const userStore = useUserStore();

		const { relation, relatedCollection, relatedPrimaryKeyField } = useRelation();

		const templateWithDefaults = computed(() => {
			return (
				props.template ||
				relatedCollection.value.meta?.display_template ||
				`{{${fieldsStore.getPrimaryKeyFieldForCollection(relation.value.collection)?.field ?? 'id'}}}`
			);
		});

		const fields = computed(() =>
			adjustFieldsForDisplays(getFieldsFromTemplate(templateWithDefaults.value), relatedCollection.value.collection)
		);

		const { items, loading } = usePreview();
		const { currentlyEditing, editItem, editsAtStart, stageEdits, stageSelections, cancelEdit } = useEdits();
		const { selectModalActive, selectedPrimaryKeys } = useSelection();
		const { sort, sortItems, sortedItems } = useSort();

		const { createAllowed, updateAllowed } = usePermissions();

		const allowDrag = computed(() => relation.value.meta?.sort_field && !props.disabled);

		return {
			t,
			relation,
			loading,
			currentlyEditing,
			editItem,
			relatedCollection,
			editsAtStart,
			stageEdits,
			stageSelections,
			cancelEdit,
			selectModalActive,
			deleteItem,
			items,
			sortItems,
			selectedPrimaryKeys,
			sort,
			sortedItems,
			get,
			getItemFromIndex,
			templateWithDefaults,
			createAllowed,
			updateAllowed,
			customFilter,
			allowDrag,
		};

		function getItemFromIndex(index: number) {
			return (sortedItems.value || items.value)[index];
		}

		function getNewItems() {
			const pkField = relatedPrimaryKeyField.value?.field;
			if (props.value === null || !pkField) return [];
			return props.value.filter((item) => typeof item === 'object' && pkField in item === false) as Record<
				string,
				any
			>[];
		}

		function getUpdatedItems() {
			const pkField = relatedPrimaryKeyField.value?.field;
			if (props.value === null || !pkField) return [];
			return props.value.filter((item) => typeof item === 'object' && pkField in item === true) as Record<
				string,
				any
			>[];
		}

		function getPrimaryKeys() {
			const pkField = relatedPrimaryKeyField.value?.field;
			if (props.value === null || !pkField) return [];
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
			const relatedPrimKey = relatedPrimaryKeyField.value?.field;
			if (props.value === null || !relatedPrimKey) return;

			if (relatedPrimKey in item === false) {
				emit(
					'input',
					props.value.filter((val) => isEqual(item, val) === false)
				);
				return;
			}

			const id = item[relatedPrimKey];
			const newValue = props.value.filter((item) => {
				if (typeof item === 'number' || typeof item === 'string') return item !== id;
				if (typeof item === 'object' && relatedPrimKey in item) {
					return item[relatedPrimKey] !== id;
				}
				return true;
			});

			if (newValue.length === 0) {
				emit('input', null);
			} else {
				emit('input', newValue);
			}
		}

		function useSort() {
			const sort = ref({ by: relation.value.meta?.sort_field || fields.value[0], desc: false });

			function sortItems(newItems: Record<string, any>[]) {
				if (!relation.value.meta?.sort_field) return;

				const itemsSorted = newItems.map((item, i) => {
					item[relation.value.meta!.sort_field!] = i;
					return item;
				});

				emit('input', itemsSorted);
			}

			const sortedItems = computed(() => {
				if (!relation.value.meta?.sort_field || sort.value.by !== relation.value.meta?.sort_field) return items.value;

				const desc = sort.value.desc;
				const sorted = sortBy(items.value, [relation.value.meta.sort_field]);
				return desc ? sorted.reverse() : sorted;
			});

			return { sort, sortItems, sortedItems };
		}

		/**
		 * Holds info about the current relationship, like related collection, primary key field
		 * of the other collection etc
		 */
		function useRelation() {
			const relation = computed<Relation>(() => {
				return relationsStore.getRelationsForField(props.collection, props.field)?.[0];
			});

			const relatedCollection = computed(() => {
				return collectionsStore.getCollection(relation.value.collection)!;
			});

			const { primaryKeyField: relatedPrimaryKeyField } = useCollection(relatedCollection.value.collection);

			return { relation, relatedCollection, relatedPrimaryKeyField };
		}

		function usePreview() {
			const loading = ref(false);
			const items = ref<Record<string, any>[]>([]);

			watch(
				() => props.value,
				async (newVal, oldVal) => {
					if (isEqual(newVal, oldVal)) return;

					loading.value = true;
					const pkField = relatedPrimaryKeyField.value?.field;
					if (!pkField) return;

					const fieldsList = [...(fields.value.length > 0 ? fields.value : getDefaultFields())];

					if (fieldsList.includes(pkField) === false) {
						fieldsList.push(pkField);
					}

					if (relation.value.meta?.sort_field && fieldsList.includes(relation.value.meta.sort_field) === false)
						fieldsList.push(relation.value.meta.sort_field);

					const fieldsToFetch = addRelatedPrimaryKeyToFields(relatedCollection.value.collection, fieldsList);

					try {
						const endpoint = relatedCollection.value.collection.startsWith('directus_')
							? `/${relatedCollection.value.collection.substring(9)}`
							: `/items/${relatedCollection.value.collection}`;

						const primaryKeys = getPrimaryKeys();

						let existingItems: any[] = [];

						if (primaryKeys && primaryKeys.length > 0) {
							const response = await api.get(endpoint, {
								params: {
									fields: fieldsToFetch,
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
					} catch (err: any) {
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

			return { currentlyEditing, editItem, editsAtStart, stageEdits, stageSelections, cancelEdit };

			function editItem(item: any, index: number) {
				const pkField = relatedPrimaryKeyField.value?.field;
				if (!pkField || !props.value || index === -1) return;
				const hasPrimaryKey = pkField in item;

				const foundItem = props.value[index];
				if (typeof foundItem === 'object' && pkField in foundItem) {
					editsAtStart.value = foundItem;
				} else {
					editsAtStart.value = hasPrimaryKey ? { [pkField]: item[pkField] || {} } : foundItem;
				}

				currentlyEditing.value = hasPrimaryKey ? item[pkField] : '+';
			}

			function stageEdits(edits: any) {
				const pkField = relatedPrimaryKeyField.value?.field;
				if (!pkField) return;

				const newValue = (props.value || []).map((item) => {
					if (
						item &&
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

				if (newValue.includes(edits) === false) {
					newValue.push(edits);
				}

				if (newValue.length === 0) emit('input', null);
				else emit('input', newValue);
			}

			function stageSelections(selectedKeys: any) {
				const newValues = [...selectedKeys, ...(props.value || []).filter((item) => typeof item === 'object')];
				emit('input', newValues);
			}

			function cancelEdit() {
				editsAtStart.value = {};
				currentlyEditing.value = null;
			}
		}

		function useSelection() {
			const selectModalActive = ref(false);

			const selectedPrimaryKeys = computed<(number | string)[]>(() => {
				const pkField = relatedPrimaryKeyField.value?.field;
				if (items.value === null || !pkField) return [];

				return items.value.filter((currentItem) => pkField in currentItem).map((currentItem) => currentItem[pkField]);
			});

			return { selectModalActive, selectedPrimaryKeys };
		}

		function getDefaultFields(): string[] {
			const fields = fieldsStore.getFieldsForCollection(relatedCollection.value.collection);
			return fields.slice(0, 3).map((field: Field) => field.field);
		}

		function usePermissions() {
			const createAllowed = computed(() => {
				const admin = userStore.currentUser?.role.admin_access === true;
				if (admin) return true;

				return !!permissionsStore.permissions.find(
					(permission) => permission.action === 'create' && permission.collection === relatedCollection.value.collection
				);
			});

			const updateAllowed = computed(() => {
				const admin = userStore.currentUser?.role.admin_access === true;
				if (admin) return true;

				return !!permissionsStore.permissions.find(
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
