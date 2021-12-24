<template>
	<v-notice v-if="relation.collection !== relation.related_collection" type="warning">
		{{ t('interfaces.list-o2m-tree-view.recursive_only') }}
	</v-notice>

	<div v-else class="tree-view">
		<nested-draggable
			:template="template"
			:collection="collection"
			:tree="stagedValues || []"
			:primary-key-field="primaryKeyField.field"
			:children-field="relation.meta.one_field"
			:parent-field="relation.field"
			:disabled="disabled"
			root
			@change="onDraggableChange"
			@input="emitValue"
		/>

		<div v-if="!disabled" class="actions">
			<v-button v-if="enableCreate" @click="addNewActive = true">{{ t('create_new') }}</v-button>
			<v-button v-if="enableSelect" @click="selectDrawer = true">
				{{ t('add_existing') }}
			</v-button>
		</div>

		<drawer-item
			v-if="!disabled"
			:active="addNewActive"
			:collection="collection"
			:primary-key="'+'"
			:edits="{}"
			:circular-field="relation.field"
			@input="addNew"
			@update:active="addNewActive = false"
		/>

		<drawer-collection
			v-if="!disabled"
			v-model:active="selectDrawer"
			:collection="collection"
			:selection="[]"
			:filter="customFilter"
			multiple
			@input="stageSelection"
		/>
	</div>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref, computed, PropType, onMounted, watch, inject } from 'vue';
import { useCollection } from '@directus/shared/composables';
import { useRelationsStore } from '@/stores';
import api from '@/api';
import { getFieldsFromTemplate } from '@directus/shared/utils';
import hideDragImage from '@/utils/hide-drag-image';
import NestedDraggable from './nested-draggable.vue';
import { Relation } from '@directus/shared/types';
import DrawerCollection from '@/views/private/components/drawer-collection';
import DrawerItem from '@/views/private/components/drawer-item';
import { Filter } from '@directus/shared/types';
import { parseFilter } from '@/utils/parse-filter';
import { render } from 'micromustache';
import { deepMap } from '@directus/shared/utils';

export default defineComponent({
	components: { NestedDraggable, DrawerCollection, DrawerItem },
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
		const openItems = ref([]);

		const { relation } = useRelation();
		const { info, primaryKeyField } = useCollection(relation.value.related_collection!);
		const { loading, error, stagedValues, fetchValues, emitValue } = useValues();

		const { stageSelection, selectDrawer } = useSelection();
		const { addNewActive, addNew } = useAddNew();

		const template = computed(() => {
			return props.displayTemplate || info.value?.meta?.display_template || `{{${primaryKeyField.value?.field}}}`;
		});

		onMounted(fetchValues);
		watch(() => props.primaryKey, fetchValues, { immediate: true });

		const dragging = ref(false);

		return {
			t,
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
			addNewActive,
			addNew,
			customFilter,
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

					stagedValues.value = response.data.data?.[relation.value.meta!.one_field!] ?? [];
				} catch (err: any) {
					error.value = err;
				} finally {
					loading.value = false;
				}
			}

			function getFieldsToFetch() {
				const fields = [
					...new Set([
						primaryKeyField.value?.field,
						relation.value.meta!.one_field,
						...getFieldsFromTemplate(template.value),
					]),
				];

				const result: string[] = [];

				const prefix = `${relation.value.meta!.one_field}.`;

				for (let i = 1; i <= 5; i++) {
					for (const field of fields) {
						result.push(`${prefix.repeat(i)}${field}`);
					}
				}

				return result;
			}

			function emitValue(value: Record<string, any>[]) {
				stagedValues.value = value;

				if (relation.value.meta?.sort_field) {
					return emit('input', addSort(value));
				}

				emit('input', value);

				function addSort(value: Record<string, any>[]): Record<string, any>[] {
					return (value || []).map((item, index) => {
						return {
							...item,
							[relation.value.meta!.sort_field!]: index + 1,
							[relation.value.meta!.one_field!]: addSort(item[relation.value.meta!.one_field!]),
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
			emitValue(stagedValues.value);
		}

		function useSelection() {
			const selectDrawer = ref(false);

			const selectedPrimaryKeys = computed<(number | string)[]>(() => {
				const pkField = primaryKeyField.value?.field;
				if (stagedValues.value === null || !pkField || !props.primaryKey) return [];

				return [props.primaryKey, ...getPKs(stagedValues.value)];

				function getPKs(values: Record<string, any>[]): (string | number)[] {
					const pks = [];

					if (pkField)
						for (const value of values) {
							if (!value[pkField]) continue;
							pks.push(value[pkField]);
							const childPKs = getPKs(value[relation.value.meta!.one_field!]);
							pks.push(...childPKs);
						}

					return pks;
				}
			});

			return { stageSelection, selectDrawer };

			async function stageSelection(newSelection: (number | string)[]) {
				loading.value = true;

				const selection = newSelection.filter((item) => selectedPrimaryKeys.value.includes(item) === false);

				const fields = [
					...new Set([
						primaryKeyField.value?.field,
						relation.value.meta!.one_field,
						...getFieldsFromTemplate(template.value),
					]),
				];

				const result: string[] = [];

				const prefix = `${relation.value.meta!.one_field}.`;

				for (let i = 1; i <= 5; i++) {
					for (const field of fields) {
						result.push(`${prefix.repeat(i)}${field}`);
					}
				}

				if (!primaryKeyField.value?.field) return;

				const response = await api.get(`/items/${props.collection}`, {
					params: {
						fields: [...fields, ...result],
						filter: {
							[primaryKeyField.value?.field]: {
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

<style scoped>
:deep(ul),
:deep(li) {
	list-style: none;
}

:deep(ul) {
	margin-left: 24px;
	padding-left: 0;
}

.actions {
	margin-top: 12px;
}

.actions .v-button + .v-button {
	margin-left: 12px;
}

.existing {
	margin-left: 12px;
}
</style>
