<template>
	<draggable
		:group="{ name: 'g1' }"
		:list="tree"
		draggable=".row"
		handle=".drag-handle"
		item-key="id"
		tag="ul"
		class="group"
		@change="$emit('change', $event)"
	>
		<template #item="{ element, index }">
			<li class="row">
				<v-list-item block :class="{ field: element.type === 'field' }">
					<div class="header">
						<div class="header-start">
							<v-icon name="drag_handle" class="drag-handle"></v-icon>
							<span class="type">{{ element.type === 'field' ? 'Field: ' : 'Logic: ' }}</span>
							<v-select
								inline
								:full-width="false"
								:model-value="element.name"
								:items="selectOptions"
								item-text="name"
								item-value="key"
								:mandatory="false"
								:groups-clickable="true"
								@group-clicked="onToggle"
								@update:modelValue="updateValue($event, index)"
							/>
							<v-select
								v-if="element.type === 'field'"
								inline
								:model-value="element.comparator"
								:items="getCompareOptions(element.name)"
								@update:modelValue="updateComparator(index, $event)"
							></v-select>
						</div>
						<div class="header-end">
							<v-icon class="delete" name="close" @click="$emit('remove-node', [index])"></v-icon>
							<v-icon v-if="false" class="expand" name="expand_more" @click="element.open = !element.open"></v-icon>
						</div>
					</div>
					<field-input
						v-if="element.type === 'field'"
						:field="element"
						:collection="collection"
						@update:field="updateNode(index, $event)"
					/>
				</v-list-item>

				<template v-if="element.open">
					<nested-draggable
						v-if="element.type === 'logic'"
						:tree="element.values"
						:collection="collection"
						@change="$emit('change', $event)"
						@add-node="$emit('add-node', [index, ...$event])"
						@remove-node="$emit('remove-node', [index, ...$event])"
						@update:tree="updateNode(index, $event)"
					/>
				</template>
			</li>
		</template>
	</draggable>
	<v-button class="add" small @click="$emit('add-node', [])">{{ t('interfaces.filter.add_node') }}</v-button>
</template>

<script lang="ts">
import { GroupableInstance } from '@/composables/groupable/groupable';
import useFieldTreeAdvanced from '@/composables/use-field-tree-advanced';
import { computed, defineComponent, PropType, ref, toRefs, watch } from 'vue';
import FieldInput from './field-input.vue';
import Draggable from 'vuedraggable';
import { LogicOperators, FilterOperators, FilterTree, Field, Logic } from './system-filter.vue';
import { useFieldsStore } from '@/stores';
import { useI18n } from 'vue-i18n';
import { getFilterOperatorsForType } from '@directus/shared/utils';
import { cloneDeep } from 'lodash';

export default defineComponent({
	name: 'NestedDraggable',
	components: {
		Draggable,
		FieldInput,
	},
	props: {
		tree: {
			type: Array as PropType<FilterTree>,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		collection: {
			type: String,
			required: true,
		},
	},
	emits: ['change', 'add-node', 'remove-node', 'update:tree'],
	setup(props, { emit }) {
		const { collection, tree } = toRefs(props);
		const { treeList, loadFieldRelations, getField } = useFieldTreeAdvanced(collection);
		const fieldsStore = useFieldsStore();
		const { t } = useI18n();

		const active = ref<Set<number>>(new Set());

		const selectOptions = computed(() => [
			{
				name: 'AND',
				key: '_and',
			},
			{
				name: 'OR',
				key: '_or',
			},
			...treeList.value,
		]);

		watch(tree, (newTree) => {
			newTree.forEach((field) => {
				if (field.type === 'field') {
					loadFieldRelations(field.name);
				}
			});
		});

		return {
			selectOptions,
			getCompareOptions,
			onToggle,
			updateValue,
			active,
			toggleActive,
			updateComparator,
			t,
			updateNode,
		};

		function updateComparator(index: number, newVal: FilterOperators) {
			const field = tree.value[index] as Field;
			field.comparator = newVal;

			if (['_in', '_nin'].includes(newVal) && Array.isArray(field.value) === false) {
				field.value = [field.value];
			} else if (
				['_between', '_nbetween'].includes(newVal) &&
				Array.isArray(field.value) === false &&
				field.value.length !== 2
			) {
				field.value = new Array(2);
			} else if (Array.isArray(field.value)) {
				field.value = [field.value].join(',');
			}
		}

		function updateValue(newKey: string, index: number) {
			let element = tree.value[index];
			if (newKey.startsWith('_')) {
				if (element.type === 'logic') {
					element.name = newKey as LogicOperators;
				} else {
					tree.value[index] = {
						type: 'logic',
						name: newKey as LogicOperators,
						values: [],
						open: element.open,
					};
				}
			} else {
				if (element.type === 'field') {
					element.name = newKey;
				} else {
					tree.value[index] = {
						type: 'field',
						name: newKey,
						comparator: '_eq',
						value: '',
						open: element.open,
					};
				}
			}
		}

		function updateNode(index: number, field: Field | FilterTree) {
			const newTree = cloneDeep(props.tree);
			const node = newTree[index];
			if (node.type === 'logic' && Array.isArray(field)) {
				node.values = field;
			} else {
				newTree[index] = field as Field;
			}
			emit('update:tree', newTree);
		}

		function getCompareOptions(name: string) {
			const fieldInfo = fieldsStore.getField(props.collection, name);
			if (fieldInfo === null) return [];
			return getFilterOperatorsForType(fieldInfo.type).map((type) => ({
				text: t(`operators.${type}`),
				value: `_${type}`,
			}));
		}

		function onToggle(item: GroupableInstance) {
			const field = getField(String(item.value));

			field?.children?.forEach((child) => {
				loadFieldRelations(child.key);
			});
		}

		function toggleActive(index: number) {
			if (active.value.has(index)) {
				active.value.delete(index);
			} else {
				active.value.add(index);
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.v-list-item.field {
	--input-height: auto;

	display: flex;
	flex-direction: column;
	align-items: stretch;
}

.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	height: 40px;
}

.header-start,
.header-end {
	display: flex;
	gap: 10px;
	align-items: center;
}

.row {
	margin-bottom: 10px;
}

.group {
	margin-top: 10px;
}

.add {
	margin-left: 24px;
}

.drag-handle {
	cursor: grab;
}

.type {
	color: var(--foreground-subdued);
}

.delete {
	margin-right: 4px;
	cursor: pointer;
}

.expand {
	cursor: pointer;
}
</style>
