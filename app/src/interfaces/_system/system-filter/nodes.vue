<template>
	<draggable
		:group="{ name: 'g1' }"
		:list="filter"
		draggable=".row"
		handle=".drag-handle"
		:item-key="getIndex"
		tag="ul"
		:animation="150"
		:invert-swap="true"
		class="group"
	>
		<template #item="{ element, index }">
			<li class="row">
				<div v-if="filterInfo[index].isField" block class="node field">
					<div class="header" @mouseenter="enter(index)" @mouseleave="leave()">
						<v-icon name="drag_indicator" class="drag-handle"></v-icon>
						<v-select
							v-tooltip="filterInfo[index].field"
							inline
							class="name"
							:full-width="false"
							:model-value="filterInfo[index].field"
							:items="fieldOptions"
							item-text="name"
							item-value="key"
							:mandatory="false"
							:groups-clickable="true"
							@group-toggle="loadFieldRelations($event.value, 1)"
							@update:modelValue="updateField(index, $event)"
						/>
						<v-select
							v-tooltip="t('interfaces.filter.change_value')"
							inline
							class="comparator"
							:model-value="filterInfo[index].comparator"
							:items="getCompareOptions(filterInfo[index].field)"
							@update:modelValue="updateComparator(index, $event)"
						></v-select>
						<input-group :field="element" :collection="collection" @update:field="updateNode(index, $event)" />
						<v-icon
							v-tooltip="t('interfaces.filter.remove_element')"
							class="delete"
							name="close"
							@click="$emit('remove-node', [index])"
						></v-icon>
					</div>
				</div>
				<div v-else class="node logic">
					<div class="header">
						<v-icon name="drag_indicator" class="drag-handle"></v-icon>
						<div class="logic-type" :class="{ blue: filterInfo[index].name === '_or' }">
							<span v-tooltip="t('interfaces.filter.change_value')" class="key" @click="toggleLogic(index)">
								{{ filterInfo[index].name === '_and' ? t('interfaces.filter.all') : t('interfaces.filter.any') }}
							</span>
							<span class="text">{{ t('interfaces.filter.of_the_following') }}</span>
						</div>
						<v-icon
							v-tooltip="t('interfaces.filter.remove_element')"
							class="delete"
							name="close"
							@click="$emit('remove-node', [index])"
						></v-icon>
					</div>
					<nodes
						:filter="element[filterInfo[index].name]"
						:collection="collection"
						:depth="depth + 1"
						@remove-node="$emit('remove-node', [`${index}.${filterInfo[index].name}`, ...$event])"
						@update:filter="updateNode(index, { [filterInfo[index].name]: $event })"
					/>
				</div>
			</li>
		</template>
	</draggable>
</template>

<script lang="ts">
import useFieldTree from '@/composables/use-field-tree';
import { computed, defineComponent, PropType, ref, toRefs } from 'vue';
import InputGroup from './input-group.vue';
import Draggable from 'vuedraggable';
import { useFieldsStore } from '@/stores';
import { useI18n } from 'vue-i18n';
import { getFilterOperatorsForType } from '@directus/shared/utils';
import { get } from 'lodash';
import { FieldFilter, Filter, FilterOperator } from '@directus/shared/types';
import { useSync } from '@directus/shared/composables';
import { fieldToFilter, getField, getNodeName, getComparator } from './system-filter.vue';

type FilterInfo =
	| {
			id: number;
			isField: true;
			name: string;
			node: Filter;
			field: string;
			comparator: string;
	  }
	| {
			id: number;
			isField: false;
			name: string;
			node: Filter;
	  };

export default defineComponent({
	name: 'Nodes',
	components: {
		Draggable,
		InputGroup,
	},
	props: {
		filter: {
			type: Object as PropType<Filter[]>,
			required: true,
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
	emits: ['remove-node', 'update:filter'],
	setup(props, { emit }) {
		const { collection } = toRefs(props);
		const filterSync = useSync(props, 'filter', emit);
		const { treeList: fieldOptions, loadFieldRelations } = useFieldTree(collection);
		const fieldsStore = useFieldsStore();
		const { t } = useI18n();

		const filterInfo = computed<FilterInfo[]>({
			get() {
				return props.filter.map((node, id) => {
					const name = getNodeName(node);
					const isField = name.startsWith('_') === false;

					return isField
						? {
								id,
								isField,
								name,
								field: getField(node),
								comparator: getComparator(node),
								node,
						  }
						: { id, name, isField, node };
				});
			},
			set(newVal) {
				emit(
					'update:filter',
					newVal.map((val) => val.node)
				);
			},
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
			getNodeName,
			getField,
			getComparator,
			filterInfo,
			getIndex,
		};

		function getIndex(item: Filter) {
			return props.filter.findIndex((filter) => filter === item);
		}

		function toggleLogic(index: number) {
			const nodeInfo = filterInfo.value[index];
			if (nodeInfo.isField) return;

			if ('_and' in nodeInfo.node) {
				filterSync.value[index] = { _or: nodeInfo.node._and as FieldFilter[] };
			} else {
				filterSync.value[index] = { _and: nodeInfo.node._or as FieldFilter[] };
			}
		}

		function updateComparator(index: number, newVal: FilterOperator) {
			const nodeInfo = filterInfo.value[index];
			if (nodeInfo.isField === false) return;

			const valuePath = nodeInfo.field + '.' + nodeInfo.comparator;
			const value = get(nodeInfo.node, valuePath);

			if (['_in', '_nin'].includes(newVal)) {
				if (Array.isArray(value) === false) update([value]);
			} else if (['_between', '_nbetween'].includes(newVal)) {
				if (Array.isArray(value) && value.length >= 2) update([value[0], value[1]]);
				else update([null, null]);
			} else if (Array.isArray(value) && value.length > 0) {
				update(value[0]);
			} else {
				update(value);
			}

			function update(value: any) {
				if (nodeInfo.isField === false) return;
				filterSync.value[index] = fieldToFilter(nodeInfo.field, newVal, value);
			}
		}

		function updateField(index: number, newField: string) {
			const nodeInfo = filterInfo.value[index];

			if (nodeInfo.isField === false) return;

			const valuePath = nodeInfo.field + '.' + nodeInfo.comparator;
			const value = get(nodeInfo.node, valuePath);

			filterSync.value[index] = fieldToFilter(newField, nodeInfo.comparator, value);
		}

		function updateNode(index: number, field: Filter) {
			filterSync.value = filterSync.value.map((val, i) => (i === index ? field : val));
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
.header {
	display: flex;
	align-items: center;
	width: fit-content;
	margin-bottom: 8px;
	padding: 2px 12px 2px 6px;
	border: var(--border-width) solid var(--border-subdued);
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
