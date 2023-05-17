<template>
	<div class="table">
		<v-notice v-if="!value || value.length === 0">
			{{ t('no_items') }}
		</v-notice>

		<div class="sections_tabs">
			<v-tabs class="tabs" :v-model="activeTab">
				<v-tab @click="onTabClick('primary')">Primary</v-tab>
				<v-tab @click="onTabClick('resale')">Resale</v-tab>
				<v-divider vertical />
			</v-tabs>
			<v-checkbox v-model="showSoldOut" class="sold_out" label="Sold Out" />
			<div class="search_wrapper">
				<v-input v-model="searchTerm" class="search_input" placeholder="Search section..." />
			</div>
		</div>
		<v-divider />

		<v-table
			v-if="value && value.length > 0"
			v-model:headers="headers"
			:items="tableItems"
			show-resize
			fixed-header
			:row-height="tableRowHeight"
			:disabled="disabled || updateAllowed === false"
			@click:row="rowClick"
		/>

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
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, watch, computed, ref } from 'vue';
import { isEqual, sortBy } from 'lodash';
import { Field } from '@directus/types';
import { i18n } from '@/lang';
import api from '@/api';
import { useCollection } from '@directus/composables';
import { useCollectionsStore } from '@/stores/collections';
import { useRelationsStore } from '@/stores/relations';
import { useFieldsStore } from '@/stores/fields';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import DrawerItem from '@/views/private/components/drawer-item.vue';
import { addRelatedPrimaryKeyToFields } from '@/utils/add-related-primary-key-to-fields';
import { hideDragImage } from '@/utils/hide-drag-image';

export default defineComponent({
	components: { DrawerItem },
	props: {
		value: {
			type: Array as PropType<Record<string, any>[]>,
			default: null,
		},
		field: {
			type: String,
			required: true,
		},
		fields: {
			type: Array as PropType<Partial<Field>[]>,
			default: () => [],
		},
		fieldData: {
			type: Object as PropType<Field | undefined>,
			default: undefined,
		},
		primaryKey: {
			type: [Number, String],
			default: null,
		},
		template: {
			type: String,
			default: null,
		},
		addLabel: {
			type: String,
			default: i18n.global.t('create_new'),
		},
		limit: {
			type: Number,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		headerPlaceholder: {
			type: String,
			default: i18n.global.t('empty_item'),
		},
		tableSpacing: {
			type: String as PropType<'compact' | 'cozy' | 'comfortable'>,
			required: true,
		},
		collection: {
			type: String,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();
		const activeIndex = ref<number | null>(null);
		const activeTab = ref('primary');
		const searchTerm = ref();
		const showSoldOut = ref(false);
		const drawerOpen = computed(() => activeIndex.value !== null);

		const headers = [
			{ value: 'section', text: 'Section', width: 180 },
			{ value: 'price_min', text: '$ Min', width: 100 },
			{ value: 'price_max', text: '$ Max', width: 100 },
			{ value: 'amount', text: 'Amount', width: 100 },
			{ value: 'capacity', text: 'Capacity', width: 120 },
			{ value: 'is_general_admission', text: 'GA', width: 200 },
		];

		const relationsStore = useRelationsStore();
		const collectionsStore = useCollectionsStore();
		const fieldsStore = useFieldsStore();
		const permissionsStore = usePermissionsStore();
		const userStore = useUserStore();

		const { relation, relatedCollection, relatedPrimaryKeyField } = useRelation();

		const fields = computed(() => getDefaultFields());

		const { items, loading } = usePreview(props.primaryKey);
		const { currentlyEditing, editItem, editsAtStart, stageEdits, cancelEdit } = useEdits();
		const { selectModalActive, selectedPrimaryKeys } = useSelection();
		const { sortedItems } = useSort();

		const { createAllowed, updateAllowed } = usePermissions();

		const tableItems = computed({
			get() {
				return (sortedItems?.value || [])
					.filter((item) => item.inventory_type == activeTab.value)
					.filter((item) => item.is_sold_out == showSoldOut.value)
					.filter((item) =>
						searchTerm.value ? item.section.toLowerCase().includes(searchTerm.value.toLowerCase()) : true
					)
					.map((item, index) => ({ ...item, index }));
			},
		});

		const activeItem = computed(() => (activeIndex.value !== null ? tableItems.value[activeIndex.value] : null));

		const tableRowHeight = computed<number>(() => {
			switch (props.tableSpacing) {
				case 'compact':
					return 32;
				case 'cozy':
					return 48;
				case 'comfortable':
					return 64;
				default:
					return 32;
			}
		});

		return {
			t,
			headers,
			tableItems,
			loading,
			tableRowHeight,
			updateValues,
			hideDragImage,
			currentlyEditing,
			editsAtStart,
			stageEdits,
			cancelEdit,
			selectModalActive,
			selectedPrimaryKeys,
			editItem,
			relation,
			relatedCollection,
			relatedPrimaryKeyField,
			activeTab,
			activeIndex,
			drawerOpen,
			sortedItems,
			activeItem,
			closeDrawer,
			searchTerm,
			showSoldOut,
			createAllowed,
			updateAllowed,
			onSort,
			rowClick,
			onTabClick,
		};

		function rowClick(row) {
			activeIndex.value = row.item.index;
			const item = getItemFromIndex(row.item.index);
			editItem(item);
		}

		function onTabClick(type) {
			activeTab.value = type;
		}

		function getItemFromIndex(index: number) {
			return tableItems.value[index];
		}

		function updateValues(index: number, updatedValues: any) {
			emitValue(
				items.value.map((item: any, i: number) => {
					if (i === index) {
						return updatedValues;
					}
					return item;
				})
			);
		}

		function emitValue(value: null | any[]) {
			if (value === null || value.length === 0) {
				return emit('input', null);
			}
			return emit('input', value);
		}

		function onSort(sortedItems: any[]) {
			if (sortedItems === null || sortedItems.length === 0) {
				return emit('input', null);
			}
			return emit('input', sortedItems);
		}

		function closeDrawer() {
			activeIndex.value = null;
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

		function usePreview(eventId) {
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
					const fieldsToFetch = addRelatedPrimaryKeyToFields(relatedCollection.value.collection, fieldsList);

					try {
						const endpoint = `/items/${relatedCollection.value.collection}?limit=3000`;
						const primaryKeys = getPrimaryKeys();

						let existingItems: any[] = [];

						if (primaryKeys && primaryKeys.length > 0) {
							const response = await api.get(endpoint, {
								params: {
									fields: fieldsToFetch,
									[`filter[event_id][_eq]`]: eventId,
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

		function useSelection() {
			const selectModalActive = ref(false);

			const selectedPrimaryKeys = computed<(number | string)[]>(() => {
				const pkField = relatedPrimaryKeyField.value?.field;
				if (items.value === null || !pkField) return [];

				return items.value.filter((currentItem) => pkField in currentItem).map((currentItem) => currentItem[pkField]);
			});

			return { selectModalActive, selectedPrimaryKeys };
		}

		function useEdits() {
			// Primary key of the item we're currently editing. If null, the edit modal should be
			// closed
			const currentlyEditing = ref<string | number | null>(null);

			// This keeps track of the starting values so we can match with it
			const editsAtStart = ref({});

			return { currentlyEditing, editItem, editsAtStart, stageEdits, cancelEdit };

			function editItem(item: any) {
				const pkField = relatedPrimaryKeyField.value?.field;
				if (!pkField) return;
				const hasPrimaryKey = pkField in item;

				const edits = (props.value || []).find(
					(edit: any) =>
						typeof edit === 'object' &&
						relatedPrimaryKeyField.value?.field &&
						edit[relatedPrimaryKeyField.value?.field] === item[relatedPrimaryKeyField.value?.field]
				);

				editsAtStart.value = edits || { [pkField]: item[pkField] || {} };
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

			function cancelEdit() {
				editsAtStart.value = {};
				currentlyEditing.value = null;
			}
		}

		function getDefaultFields(): string[] {
			const fields = fieldsStore.getFieldsForCollection(relatedCollection.value.collection);
			return fields.map((field: Field) => field.field);
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

<style>
.tabs {
	--v-tab-color: var(--foreground-normal);
	--v-tab-color-active: var(--green);
	--v-tab-background-color: var(--background-page);
	--v-tab-background-color-active: var(--background-page);
}
</style>

<style lang="scss" scoped>
.sections_tabs {
	display: flex;
}

.sold_out {
	margin-left: 12px;
}

.search_wrapper {
	display: flex;
	flex: 1;
	padding-left: 62px;
}

.search_input {
	height: 34px;
}

.v-notice {
	margin-bottom: 4px;
}

.v-list {
	--v-list-padding: 0 0 4px;
}

.v-list-item {
	display: flex;
	cursor: pointer;
}

.drag-handle {
	cursor: grap;
}

.drawer-item-content {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}

.add-new {
	margin-top: 8px;
}
</style>
