<template>
	<v-notice type="warning" v-if="relation.many_collection !== relation.one_collection">
		{{ $t('interfaces.tree-view.recursive_only') }}
	</v-notice>

	<div v-else class="tree-view">
		<nested-draggable
			:template="template"
			:collection="collection"
			:tree="stagedValues || []"
			:primary-key-field="primaryKeyField.field"
			:children-field="relation.one_field"
			:parent-field="relation.many_field"
			:disabled="disabled"
			root
			@change="onDraggableChange"
			@input="emitValue"
		/>

		<div class="actions" v-if="!disabled">
			<v-button v-if="enableCreate" @click="addNewActive = true">{{ $t('create_new') }}</v-button>
			<v-button v-if="enableSelect" @click="selectDrawer = true">
				{{ $t('add_existing') }}
			</v-button>
		</div>

		<drawer-item
			v-if="!disabled"
			:active="addNewActive"
			:collection="collection"
			:primary-key="'+'"
			:edits="{}"
			:circular-field="relation.many_field"
			@input="addNew"
			@update:active="addNewActive = false"
		/>

		<drawer-collection
			v-if="!disabled"
			:active.sync="selectDrawer"
			:collection="collection"
			:selection="[]"
			:filters="selectionFilters"
			@input="stageSelection"
			multiple
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType, onMounted, watch } from '@vue/composition-api';
import { useCollection } from '@/composables/use-collection';
import { useRelationsStore } from '@/stores';
import api from '@/api';
import { getFieldsFromTemplate } from '@/utils/get-fields-from-template';
import draggable from 'vuedraggable';
import hideDragImage from '@/utils/hide-drag-image';
import NestedDraggable from './nested-draggable.vue';
import { Filter } from '@/types';
import { Relation } from '@/types';
import DrawerCollection from '@/views/private/components/drawer-collection';
import DrawerItem from '@/views/private/components/drawer-item';

export default defineComponent({
	components: { draggable, NestedDraggable, DrawerCollection, DrawerItem },
	props: {
		value: {
			type: Array as PropType<(number | string | Record<string, any>)[]>,
			default: null,
		},
		displayTemplate: {
			type: String,
			default: undefined,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		collection: {
			type: String,
			required: true,
		},
		field: {
			type: String,
			required: true,
		},
		primaryKey: {
			type: [String, Number],
			default: undefined,
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
		const openItems = ref([]);

		const { relation } = useRelation();
		const { info, primaryKeyField } = useCollection(relation.value.one_collection);
		const { loading, error, stagedValues, fetchValues, emitValue } = useValues();

		const { stageSelection, selectDrawer, selectionFilters } = useSelection();
		const { addNewActive, addNew } = useAddNew();

		const template = computed(() => {
			return props.displayTemplate || info.value?.meta?.display_template || `{{${primaryKeyField.value.field}}}`;
		});

		onMounted(fetchValues);
		watch(() => props.primaryKey, fetchValues, { immediate: true });

		const dragging = ref(false);

		return {
			relation,
			openItems,
			template,
			loading,
			error,
			stagedValues,
			fetchValues,
			primaryKeyField,
			onDraggableChange,
			hideDragImage,
			dragging,
			emitValue,
			stageSelection,
			selectDrawer,
			selectionFilters,
			addNewActive,
			addNew,
		};

		function useValues() {
			const loading = ref(false);
			const error = ref<any>(null);

			const stagedValues = ref<Record<string, any>[]>([]);

			return { loading, error, stagedValues, fetchValues, emitValue, getFieldsToFetch };

			async function fetchValues() {
				if (!props.primaryKey || !relation.value || props.primaryKey === '+') return;

				// In case props.value is already an array of edited objects
				if (props.value?.length > 0 && props.value.every((item) => typeof item === 'object')) {
					stagedValues.value = props.value as Record<string, any>[];
					return;
				}

				loading.value = true;

				try {
					const response = await api.get(`/items/${props.collection}/${encodeURIComponent(props.primaryKey)}`, {
						params: {
							fields: getFieldsToFetch(),
						},
					});

					stagedValues.value = response.data.data?.[relation.value.one_field!] ?? [];
				} catch (err) {
					error.value = err;
				} finally {
					loading.value = false;
				}
			}

			function getFieldsToFetch() {
				const fields = [
					...new Set([primaryKeyField.value.field, relation.value.one_field, ...getFieldsFromTemplate(template.value)]),
				];

				const result: string[] = [];

				const prefix = `${relation.value.one_field}.`;

				for (let i = 1; i <= 5; i++) {
					for (const field of fields) {
						result.push(`${prefix.repeat(i)}${field}`);
					}
				}

				return result;
			}

			function emitValue(value: Record<string, any>[]) {
				stagedValues.value = value;

				if (relation.value.sort_field) {
					return emit('input', addSort(value));
				}

				emit('input', value);

				function addSort(value: Record<string, any>[]): Record<string, any>[] {
					return (value || []).map((item, index) => {
						return {
							...item,
							[relation.value.sort_field!]: index,
							[relation.value.one_field!]: addSort(item[relation.value.one_field!]),
						};
					});
				}
			}
		}

		function useRelation() {
			const relation = computed<Relation>(() => {
				return relationsStore.getRelationsForField(props.collection, props.field)?.[0];
			});

			return { relation };
		}

		function onDraggableChange() {
			emit('input', stagedValues.value);
		}

		function useSelection() {
			const selectDrawer = ref(false);

			const selectedPrimaryKeys = computed<(number | string)[]>(() => {
				if (stagedValues.value === null) return [];

				const pkField = primaryKeyField.value.field;

				return [props.primaryKey, ...getPKs(stagedValues.value)];

				function getPKs(values: Record<string, any>[]): (string | number)[] {
					const pks = [];

					for (const value of values) {
						if (!value[pkField]) continue;
						pks.push(value[pkField]);
						const childPKs = getPKs(value[relation.value.one_field!]);
						pks.push(...childPKs);
					}

					return pks;
				}
			});

			const selectionFilters = computed<Filter[]>(() => {
				const pkField = primaryKeyField.value.field;

				if (selectedPrimaryKeys.value.length === 0) return [];

				return [
					{
						key: 'selection',
						field: pkField,
						operator: 'nin',
						value: selectedPrimaryKeys.value.join(','),
						locked: true,
					},
					{
						key: 'parent',
						field: relation.value.many_field,
						operator: 'null',
						value: true,
						locked: true,
					},
				] as Filter[];
			});

			return { stageSelection, selectDrawer, selectionFilters };

			async function stageSelection(newSelection: (number | string)[]) {
				loading.value = true;

				const selection = newSelection.filter((item) => selectedPrimaryKeys.value.includes(item) === false);

				const fields = [
					...new Set([primaryKeyField.value.field, relation.value.one_field, ...getFieldsFromTemplate(template.value)]),
				];

				const result: string[] = [];

				const prefix = `${relation.value.one_field}.`;

				for (let i = 1; i <= 5; i++) {
					for (const field of fields) {
						result.push(`${prefix.repeat(i)}${field}`);
					}
				}

				const response = await api.get(`/items/${props.collection}`, {
					params: {
						fields: [...fields, ...result],
						filter: {
							[primaryKeyField.value.field]: {
								_in: selection,
							},
						},
					},
				});

				const newVal = [...response.data.data, ...stagedValues.value];

				if (newVal.length === 0) emitValue([]);
				else emitValue(newVal);

				loading.value = false;
			}
		}

		function useAddNew() {
			const addNewActive = ref(false);

			return { addNewActive, addNew };

			function addNew(item: Record<string, any>) {
				emitValue([...stagedValues.value, item]);
			}
		}
	},
});
</script>

<style lang="scss" scoped>
::v-deep {
	ul,
	li {
		list-style: none;
	}

	ul {
		margin-left: 24px;
		padding-left: 0;
	}
}

.actions {
	margin-top: 12px;

	.v-button + .v-button {
		margin-left: 12px;
	}
}

.existing {
	margin-left: 12px;
}
</style>
