<template>
	<v-notice v-if="!relationInfo.relation.collection" type="warning">
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
				:disabled="!relationInfo.sortField"
				@update:model-value="sortItems($event)"
			>
				<template #item="{ element }">
					<v-list-item
						:dense="sortedItems.length > 4"
						block
						clickable
						:disabled="disabled || updateAllowed === false"
						@click="editItem(element)"
					>
						<v-icon v-if="relationInfo.sortField" name="drag_handle" class="drag-handle" left @click.stop="() => {}" />
						<render-template
							:collection="relationInfo.relation.collection"
							:item="element"
							:template="templateWithDefaults"
						/>
						<div class="spacer" />
						<v-icon v-if="!disabled && updateAllowed" name="close" @click.stop="deselect(element)" />
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
			:collection="relationInfo.relation.collection"
			:primary-key="currentlyEditing || '+'"
			:edits="editsAtStart"
			:circular-field="relationInfo.relatedField"
			@input="stageEdits"
			@update:active="cancelEdit"
		/>

		<drawer-collection
			v-if="!disabled"
			v-model:active="selectModalActive"
			:collection="relationInfo.relation.collection"
			:selection="selectedPrimaryKeys"
			multiple
			@input="stageSelection"
		/>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, computed, watch, PropType, toRefs } from 'vue';
import api from '@/api';
import { useFieldsStore, usePermissionsStore, useUserStore } from '@/stores/';
import DrawerItem from '@/views/private/components/drawer-item';
import DrawerCollection from '@/views/private/components/drawer-collection';
import { Field } from '@directus/shared/types';
import { get, isEqual, sortBy } from 'lodash';
import { unexpectedError } from '@/utils/unexpected-error';
import { getFieldsFromTemplate } from '@directus/shared/utils';
import { addRelatedPrimaryKeyToFields } from '@/utils/add-related-primary-key-to-fields';
import Draggable from 'vuedraggable';
import adjustFieldsForDisplays from '@/utils/adjust-fields-for-displays';
import { useRelationInfo } from '@/composables/use-relation-info';
import { useSelection } from '@/composables/use-selection';

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
	emits: ['input'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const { collection, field } = toRefs(props);

		const fieldsStore = useFieldsStore();
		const permissionsStore = usePermissionsStore();
		const userStore = useUserStore();

		const { relationInfo } = useRelationInfo({ collection, field });

		const templateWithDefaults = computed(
			() =>
				props.template ||
				relationInfo.value.relation?.displayTemplate ||
				`{{${relationInfo.value.relation?.primaryKey.field}}`
		);

		const fields = computed(() =>
			adjustFieldsForDisplays(
				getFieldsFromTemplate(templateWithDefaults.value),
				relationInfo.value.relation?.collection ?? ''
			)
		);

		const { items, initialItems, loading } = usePreview();
		const { currentlyEditing, editItem, editsAtStart, stageEdits, cancelEdit } = useEdits();
		const { sort, sortItems, sortedItems } = useSort();
		const { deselect, stageSelection, selectModalActive, selectedPrimaryKeys } = useSelection({
			items,
			initialItems,
			relationInfo,
			emit: emitter,
		});

		const { createAllowed, updateAllowed } = usePermissions();

		return {
			t,
			relationInfo,
			loading,
			currentlyEditing,
			editItem,
			editsAtStart,
			stageEdits,
			cancelEdit,
			stageSelection,
			selectModalActive,
			deselect,
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
		};

		function emitter(newVal: any | any[] | null) {
			emit('input', newVal);
		}

		function getItemFromIndex(index: number) {
			return (sortedItems.value || items.value)[index];
		}

		function getNewItems() {
			const pkField = relationInfo.value.relation?.primaryKey.field;
			if (props.value === null || !pkField) return [];
			return props.value.filter((item) => typeof item === 'object' && pkField in item === false) as Record<
				string,
				any
			>[];
		}

		function getUpdatedItems() {
			const pkField = relationInfo.value.relation?.primaryKey.field;
			if (props.value === null || !pkField) return [];
			return props.value.filter((item) => typeof item === 'object' && pkField in item === true) as Record<
				string,
				any
			>[];
		}

		function getPrimaryKeys() {
			const pkField = relationInfo.value.relation?.primaryKey.field;
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
			const sort = ref({ by: relationInfo.value.sortField || fields.value[0], desc: false });

			function sortItems(newItems: Record<string, any>[]) {
				if (!relationInfo.value.sortField) return;

				const itemsSorted = newItems.map((item, i) => {
					item[relationInfo.value.sortField] = i;
					return item;
				});

				emit('input', itemsSorted);
			}

			const sortedItems = computed(() => {
				if (!relationInfo.value.sortField || sort.value.by !== relationInfo.value.sortField) return items.value;

				const desc = sort.value.desc;
				const sorted = sortBy(items.value, [relationInfo.value.sortField]);
				return desc ? sorted.reverse() : sorted;
			});

			return { sort, sortItems, sortedItems };
		}

		function usePreview() {
			const loading = ref(false);
			const initialItems = ref<Record<string, any>[]>([]);
			const items = ref<Record<string, any>[]>([]);

			watch(
				() => props.value,
				async (newVal, oldVal) => {
					if (isEqual(newVal, oldVal)) return;

					loading.value = true;
					const pkField = relationInfo.value.relation?.primaryKey.field;
					if (!pkField) return;

					const fieldsList = [...(fields.value.length > 0 ? fields.value : getDefaultFields())];

					if (fieldsList.includes(pkField) === false) {
						fieldsList.push(pkField);
					}

					if (relationInfo.value.sortField && fieldsList.includes(relationInfo.value.sortField) === false)
						fieldsList.push(relationInfo.value.sortField);

					const fieldsToFetch = addRelatedPrimaryKeyToFields(relationInfo.value.relation?.collection ?? '', fieldsList);

					try {
						const endpoint = relationInfo.value.relation?.collection.startsWith('directus_')
							? `/${relationInfo.value.relation?.collection.substring(9)}`
							: `/items/${relationInfo.value.relation?.collection}`;

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

						const mergedItems = existingItems
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

						items.value = mergedItems;

						if (!initialItems.value.length) initialItems.value = [...mergedItems];
					} catch (err: any) {
						unexpectedError(err);
					} finally {
						loading.value = false;
					}
				},
				{ immediate: true }
			);

			return { items, initialItems, loading };
		}

		function useEdits() {
			// Primary key of the item we're currently editing. If null, the edit modal should be
			// closed
			const currentlyEditing = ref<string | number | null>(null);

			// This keeps track of the starting values so we can match with it
			const editsAtStart = ref({});

			return { currentlyEditing, editItem, editsAtStart, stageEdits, cancelEdit };

			function editItem(item: any) {
				const pkField = relationInfo.value.relation?.primaryKey.field;
				if (!pkField) return;
				const hasPrimaryKey = pkField in item;

				const edits = (props.value || []).find(
					(edit: any) =>
						typeof edit === 'object' &&
						relationInfo.value.relation?.primaryKey.field &&
						edit[relationInfo.value.relation?.primaryKey.field] === item[relationInfo.value.relation?.primaryKey.field]
				);

				editsAtStart.value = edits || { [pkField]: item[pkField] || {} };
				currentlyEditing.value = hasPrimaryKey ? item[pkField] : '+';
			}

			function stageEdits(edits: any) {
				const pkField = relationInfo.value.relation?.primaryKey.field;
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
			const fields = fieldsStore.getFieldsForCollection(relationInfo.value.relation?.collection ?? '');
			return fields.slice(0, 3).map((field: Field) => field.field);
		}

		function usePermissions() {
			const createAllowed = computed(() => {
				const admin = userStore.currentUser?.role.admin_access === true;
				if (admin) return true;

				return !!permissionsStore.permissions.find(
					(permission) =>
						permission.action === 'create' && permission.collection === relationInfo.value.relation?.collection
				);
			});

			const updateAllowed = computed(() => {
				const admin = userStore.currentUser?.role.admin_access === true;
				if (admin) return true;

				return !!permissionsStore.permissions.find(
					(permission) =>
						permission.action === 'update' && permission.collection === relationInfo.value.relation?.collection
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
