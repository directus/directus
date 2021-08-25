<template>
	<draggable
		:group="{ name: 'g1' }"
		:list="tree"
		draggable=".row"
		:disabled="depth === 1"
		handle=".drag-handle"
		item-key="id"
		tag="ul"
		class="group"
		@change="$emit('change', $event)"
	>
		<template #item="{ element, index }">
			<li class="row">
				<div v-if="element.type === 'logic'" class="logic">
					<div class="header">
						<div class="header-start">
							<v-icon name="drag_handle" class="drag-handle"></v-icon>
							<v-select
								inline
								:full-width="false"
								:model-value="element.name"
								:items="typeOptions"
								item-text="name"
								item-value="key"
								:mandatory="false"
								:groups-clickable="true"
								@group-clicked="loadFieldRelations($event.value, 1)"
								@update:modelValue="updateValue($event, index)"
							/>
						</div>
						<v-icon class="delete" name="close" @click="$emit('remove-node', [index])"></v-icon>
					</div>
					<nested-draggable
						v-if="element.type === 'logic'"
						:tree="element.values"
						:collection="collection"
						:depth="depth + 1"
						@change="$emit('change', $event)"
						@add-node="$emit('add-node', [index, ...$event])"
						@remove-node="$emit('remove-node', [index, ...$event])"
						@update:tree="updateNode(index, $event)"
					/>
				</div>
				<v-list-item v-else block class="field">
					<div class="header">
						<div class="header-start">
							<v-icon name="drag_handle" class="drag-handle"></v-icon>
							<v-select
								inline
								:full-width="false"
								:model-value="element.name"
								:items="typeOptions"
								item-text="name"
								item-value="key"
								:mandatory="false"
								:groups-clickable="true"
								@group-clicked="loadFieldRelations($event.value, 1)"
								@update:modelValue="updateValue($event, index)"
							/>
							<v-select
								inline
								:model-value="element.comparator"
								:items="getCompareOptions(element.name)"
								@update:modelValue="updateComparator(index, $event)"
							></v-select>
						</div>
						<v-icon class="delete" name="close" @click="$emit('remove-node', [index])"></v-icon>
					</div>
					<field-input :field="element" :collection="collection" @update:field="updateNode(index, $event)" />
				</v-list-item>
			</li>
		</template>
	</draggable>
	<v-button v-if="(depth === 1 && tree.length === 0) || depth === 2" class="add" small @click="$emit('add-node', [])">
		{{ t('interfaces.filter.add_node') }}
	</v-button>
</template>

<script lang="ts">
import useFieldTree from '@/composables/use-field-tree';
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
		depth: {
			type: Number,
			default: 1,
		},
	},
	emits: ['change', 'add-node', 'remove-node', 'update:tree'],
	setup(props, { emit }) {
		const { collection, tree } = toRefs(props);
		const { treeList, loadFieldRelations } = useFieldTree(collection);
		const fieldsStore = useFieldsStore();
		const { t } = useI18n();

		const typeOptions = computed(() => [
			{
				name: t('interfaces.filter.and'),
				key: '_and',
			},
			{
				name: t('interfaces.filter.or'),
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
			typeOptions,
			getCompareOptions,
			updateValue,
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
	},
});
</script>

<style lang="scss" scoped>
.v-list-item {
	--input-height: auto;

	display: flex;
	flex-direction: column;
	align-items: stretch;
}

.logic {
	position: relative;
	display: flex;
	flex-direction: column;
	padding-left: 4px;

	&::before {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		background-color: var(--primary);
		opacity: 0.1;
		content: '';
		pointer-events: none;
	}

	&::after {
		position: absolute;
		top: 0;
		left: 0px;
		width: 4px;
		height: 100%;
		background-color: var(--primary);
		border-radius: 2px;
		content: '';
	}
}

.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	height: 50px;
}

.logic > .header {
	padding-right: 8px;
	color: var(--primary);
}

.field > .header {
	height: 40px;
}

.header-start {
	display: flex;
	gap: 10px;
	align-items: center;
}

.row {
	margin-bottom: 10px;
}

.add {
	margin-bottom: 12px;
	margin-left: 8px;
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
