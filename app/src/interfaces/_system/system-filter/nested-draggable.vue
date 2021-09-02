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
				<div v-if="element.type === 'logic'" class="node logic">
					<div class="header">
						<v-icon name="drag_indicator" class="drag-handle"></v-icon>
						<div class="logic-type" :class="{ blue: element.name === '_or' }">
							<span class="key" @click="toggleLogic(index)">
								{{ element.name === '_and' ? t('interfaces.filter.all') : t('interfaces.filter.any') }}
							</span>
							<span class="text">{{ t('interfaces.filter.of_the_following') }}</span>
						</div>
						<v-icon class="delete" name="close" @click="$emit('remove-node', [index])"></v-icon>
					</div>
					<nested-draggable
						v-if="element.type === 'logic'"
						:tree="element.values"
						:collection="collection"
						:depth="depth + 1"
						@change="$emit('change', $event)"
						@remove-node="$emit('remove-node', [index, ...$event])"
						@update:tree="updateNode(index, $event)"
					/>
				</div>
				<div v-else block class="node field">
					<div class="header">
						<v-icon name="drag_indicator" class="drag-handle"></v-icon>
						<v-select
							inline
							class="name"
							:full-width="false"
							:model-value="element.name"
							:items="fieldOptions"
							item-text="name"
							item-value="key"
							:mandatory="false"
							:groups-clickable="true"
							@group-clicked="loadFieldRelations($event.value, 1)"
							@update:modelValue="updateField($event, index)"
						/>
						<v-select
							inline
							class="comparator"
							:model-value="element.comparator"
							:items="getCompareOptions(element.name)"
							@update:modelValue="updateComparator(index, $event)"
						></v-select>
						<field-input :field="element" :collection="collection" @update:field="updateNode(index, $event)" />
						<v-icon class="delete" name="close" @click="$emit('remove-node', [index])"></v-icon>
					</div>
				</div>
			</li>
		</template>
	</draggable>
</template>

<script lang="ts">
import useFieldTree from '@/composables/use-field-tree';
import { defineComponent, PropType, toRefs, watch } from 'vue';
import FieldInput from './field-input.vue';
import Draggable from 'vuedraggable';
import { FilterOperators, FilterTree, Field } from './system-filter.vue';
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
		collection: {
			type: String,
			required: true,
		},
		depth: {
			type: Number,
			default: 1,
		},
	},
	emits: ['change', 'remove-node', 'update:tree'],
	setup(props, { emit }) {
		const { collection, tree } = toRefs(props);
		const { treeList: fieldOptions, loadFieldRelations } = useFieldTree(collection);
		const fieldsStore = useFieldsStore();
		const { t } = useI18n();

		watch(tree, (newTree) => {
			newTree.forEach((field) => {
				if (field.type === 'field' && field.name !== null) {
					loadFieldRelations(field.name);
				}
			});
		});

		return {
			fieldOptions,
			getCompareOptions,
			updateField,
			updateComparator,
			t,
			updateNode,
			toggleLogic,
			loadFieldRelations,
		};

		function toggleLogic(index: number) {
			if (tree.value[index].name === '_and') {
				tree.value[index].name = '_or';
			} else {
				tree.value[index].name = '_and';
			}
		}

		function updateComparator(index: number, newVal: FilterOperators) {
			const field = tree.value[index] as Field;
			field.comparator = newVal;

			if (['_in', '_nin'].includes(newVal)) {
				if (Array.isArray(field.value) === false) field.value = [field.value];
			} else if (['_between', '_nbetween'].includes(newVal)) {
				if (Array.isArray(field.value) && field.value.length >= 2) field.value = [field.value[0], field.value[1]];
				else field.value = [null, null];
			} else if (Array.isArray(field.value) && field.value.length > 0) {
				field.value = field.value[0];
			}

			emit('update:tree', tree.value);
		}

		function updateField(newKey: string, index: number) {
			tree.value[index].name = newKey;
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
			// TODO: Support m2a fields
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
.header {
	display: flex;
	align-items: center;
	width: fit-content;
	margin-bottom: 8px;
	padding: 8px 12px 8px 6px;
	border: var(--border-width) solid var(--border-normal);
	border-radius: 100px;

	.logic-type {
		font-weight: 600;

		.key {
			margin-right: 4px;
			padding: 2px 6px;
			color: var(--green);
			background-color: var(--green-25);
			border-radius: 6px;
			cursor: pointer;
		}

		&.blue .key {
			color: var(--blue);
			background-color: var(--blue-25);
		}
	}

	:deep(.inline-display) {
		padding-right: 0px;

		.v-icon {
			display: none;
		}
	}

	.name {
		display: inline-block;
		margin-right: 8px;
	}

	.comparator {
		display: inline-block;
		margin-right: 8px;
		font-weight: 600;
	}

	.value {
		color: var(--green);
	}

	.delete {
		display: none;
		margin-left: 8px;
		color: var(--danger);
		cursor: pointer;
	}

	&:hover {
		.delete {
			display: block;
		}
	}

	.drag-handle {
		margin-right: 6px;
		color: var(--foreground-subdued);
		cursor: grab;
	}
}
</style>
