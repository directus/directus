<template>
	<draggable
		tag="ul"
		draggable=".row"
		handle=".drag-handle"
		class="group"
		:list="filterSync"
		:group="{ name: 'g1' }"
		:item-key="getIndex"
		:swap-threshold="0.3"
		:force-fallback="true"
		@change="$emit('change')"
	>
		<template #item="{ element, index }">
			<li class="row">
				<div v-if="filterInfo[index].isField" block class="node field">
					<div class="header" :class="{ inline }">
						<v-icon name="drag_indicator" class="drag-handle" small></v-icon>
						<v-select
							inline
							class="name"
							item-text="name"
							item-value="key"
							placement="bottom-start"
							:full-width="false"
							:model-value="filterInfo[index].field"
							:items="fieldOptions"
							:mandatory="false"
							:groups-clickable="true"
							@group-toggle="loadFieldRelations($event.value, 1)"
							@update:modelValue="updateField(index, $event)"
						>
							<template #preview>{{ getFieldPreview(element) }}</template>
						</v-select>
						<v-select
							inline
							class="comparator"
							placement="bottom-start"
							:model-value="filterInfo[index].comparator"
							:items="getCompareOptions(filterInfo[index].field)"
							@update:modelValue="updateComparator(index, $event)"
						/>
						<input-group :field="element" :collection="collection" @update:field="replaceNode(index, $event)" />
						<span class="delete">
							<v-icon
								v-tooltip="t('delete_label')"
								name="close"
								small
								clickable
								@click="$emit('remove-node', [index])"
							/>
						</span>
					</div>
				</div>

				<div v-else class="node logic">
					<div class="header" :class="{ inline }">
						<v-icon name="drag_indicator" class="drag-handle" small />
						<div class="logic-type" :class="{ or: filterInfo[index].name === '_or' }">
							<span class="key" @click="toggleLogic(index)">
								{{ filterInfo[index].name === '_and' ? t('interfaces.filter.all') : t('interfaces.filter.any') }}
							</span>
							<span class="text">{{ t('interfaces.filter.of_the_following') }}</span>
						</div>
						<span class="delete">
							<v-icon
								v-tooltip="t('delete_label')"
								name="close"
								small
								clickable
								@click="$emit('remove-node', [index])"
							/>
						</span>
					</div>
					<nodes
						:filter="element[filterInfo[index].name]"
						:collection="collection"
						:depth="depth + 1"
						:inline="inline"
						@change="$emit('change')"
						@remove-node="$emit('remove-node', [`${index}.${filterInfo[index].name}`, ...$event])"
						@update:filter="replaceNode(index, { [filterInfo[index].name]: $event })"
					/>
				</div>
			</li>
		</template>
	</draggable>
</template>

<script lang="ts">
import { useFieldTree } from '@/composables/use-field-tree';
import { computed, defineComponent, PropType, toRefs } from 'vue';
import InputGroup from './input-group.vue';
import Draggable from 'vuedraggable';
import { useFieldsStore } from '@/stores';
import { useI18n } from 'vue-i18n';
import { getFilterOperatorsForType } from '@directus/shared/utils';
import { get } from 'lodash';
import { FieldFilter, Filter, FieldFilterOperator, LogicalFilterAND, LogicalFilterOR } from '@directus/shared/types';
import { useSync } from '@directus/shared/composables';
import { fieldToFilter, getField, getNodeName, getComparator } from './utils';
import { toArray } from '@directus/shared/utils';

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
		inline: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['remove-node', 'update:filter', 'change'],
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
			replaceNode,
			toggleLogic,
			loadFieldRelations,
			getNodeName,
			getField,
			getComparator,
			filterInfo,
			getIndex,
			getFieldPreview,
			filterSync,
		};

		function getFieldPreview(node: Record<string, any>) {
			const fieldKey = getField(node);

			const fieldParts = fieldKey.split('.');

			const fieldNames = fieldParts.map((fieldKey, index) => {
				const pathPrefix = fieldParts.slice(0, index);
				const field = fieldsStore.getField(props.collection, [...pathPrefix, fieldKey].join('.'));
				return field?.name ?? fieldKey;
			});

			return fieldNames.join(' -> ');
		}

		function getIndex(item: Filter) {
			return props.filter.findIndex((filter) => filter === item);
		}

		function toggleLogic(index: number) {
			const nodeInfo = filterInfo.value[index];

			if (filterInfo.value[index].isField) return;

			if ('_and' in nodeInfo.node) {
				filterSync.value = filterSync.value.map((filter, filterIndex) => {
					if (filterIndex === index) {
						return { _or: (nodeInfo.node as LogicalFilterAND)._and as FieldFilter[] };
					}

					return filter;
				});
			} else {
				filterSync.value = filterSync.value.map((filter, filterIndex) => {
					if (filterIndex === index) {
						return { _and: (nodeInfo.node as LogicalFilterOR)._or as FieldFilter[] };
					}

					return filter;
				});
			}
		}

		function updateComparator(index: number, operator: keyof FieldFilterOperator) {
			const nodeInfo = filterInfo.value[index];
			if (nodeInfo.isField === false) return;

			const valuePath = nodeInfo.field + '.' + nodeInfo.comparator;
			let value = get(nodeInfo.node, valuePath);

			switch (operator) {
				case '_in':
				case '_nin':
					update(toArray(value) || []);
					break;
				case '_between':
				case '_nbetween':
					update((toArray(value) || []).slice(0, 2));
					break;
				case '_null':
				case '_nnull':
				case '_empty':
				case '_nempty':
					update(true);
					break;
				case '_intersects':
				case '_nintersects':
				case '_intersects_bbox':
				case '_nintersects_bbox':
					if (['_intersects', '_nintersects', '_intersects_bbox', '_nintersects_bbox'].includes(nodeInfo.comparator)) {
						update(value);
					} else {
						update(null);
					}
					break;
				default:
					update(Array.isArray(value) ? value[0] : value);
					break;
			}

			function update(value: any) {
				if (nodeInfo.isField === false) return;

				filterSync.value = filterSync.value.map((filter, filterIndex) => {
					if (filterIndex === index) return fieldToFilter(nodeInfo.field, operator, value);
					return filter;
				});
			}
		}

		function updateField(index: number, newField: string) {
			const nodeInfo = filterInfo.value[index];
			const oldFieldInfo = fieldsStore.getField(props.collection, nodeInfo.name);
			const newFieldInfo = fieldsStore.getField(props.collection, newField);

			if (nodeInfo.isField === false) return;

			const valuePath = nodeInfo.field + '.' + nodeInfo.comparator;
			let value = get(nodeInfo.node, valuePath);
			let comparator = nodeInfo.comparator;

			if (oldFieldInfo?.type !== newFieldInfo?.type) {
				value = null;
				comparator = getCompareOptions(newField)[0].value;
			}

			filterSync.value = filterSync.value.map((filter, filterIndex) => {
				if (filterIndex === index) return fieldToFilter(newField, comparator, value);
				return filter;
			});
		}

		function replaceNode(index: number, newFilter: Filter) {
			filterSync.value = filterSync.value.map((val, filterIndex) => {
				if (filterIndex === index) return newFilter;
				return val;
			});
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
	position: relative;
	display: flex;
	align-items: center;
	width: fit-content;
	margin-right: 18px;
	margin-bottom: 8px;
	padding: 2px 6px;
	padding-right: 8px;
	background-color: var(--background-page);
	border: var(--border-width) solid var(--border-subdued);
	border-radius: 100px;
	transition: border-color var(--fast) var(--transition);

	.logic-type {
		color: var(--foreground-subdued);

		.key {
			margin-right: 4px;
			padding: 2px 6px;
			color: var(--primary);
			background-color: var(--primary-alt);
			border-radius: 6px;
			cursor: pointer;
			transition: var(--fast) var(--transition);
			transition-property: color, background-color;

			&:hover {
				background-color: var(--primary-25);
			}
		}

		&.or .key {
			color: var(--secondary);
			background-color: var(--secondary-alt);

			&:hover {
				background-color: var(--secondary-25);
			}
		}
	}

	:deep(.inline-display) {
		padding-right: 0px;

		.v-icon {
			display: none;
		}
	}

	.name,
	.comparator {
		position: relative;
		z-index: 2;
		display: inline-block;
		margin-right: 8px;

		&::before {
			position: absolute;
			top: 0px;
			left: -4px;
			z-index: -1;
			width: calc(100% + 8px);
			height: 100%;
			background-color: var(--background-normal);
			border-radius: 6px;
			opacity: 0;
			transition: opacity var(--fast) var(--transition);
			content: '';
			pointer-events: none;
		}

		&:hover::before {
			opacity: 1;
		}
	}

	.comparator {
		font-weight: 700;
	}

	.value {
		color: var(--green);
	}

	.delete {
		--v-icon-color: var(--foreground-subdued);
		--v-icon-color-hover: var(--danger);

		position: absolute;
		top: 50%;
		left: 100%;
		padding-left: 4px;
		transform: translateY(-50%);
		opacity: 0;
		transition: opacity var(--fast) var(--transition);
	}

	&:hover {
		border-color: var(--border-normal);

		.delete,
		&:hover {
			opacity: 1;
		}
	}

	.drag-handle {
		--v-icon-color: var(--foreground-subdued);

		margin-right: 4px;
		cursor: grab;
	}

	&.inline {
		width: auto;
		margin-right: 0;
		padding-right: 12px;

		.delete {
			right: 8px;
			left: unset;
			background-color: var(--background-page);
		}
	}
}

.group :deep(.sortable-ghost) {
	.node .header {
		background-color: var(--primary-alt);
		border-color: var(--primary);

		> * {
			opacity: 0;
		}
	}
}
</style>
