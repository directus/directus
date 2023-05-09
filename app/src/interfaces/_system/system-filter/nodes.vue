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
						<span v-if="!isExistingField(element)" class="plain-name">{{ getFieldPreview(element) }}</span>
						<v-menu v-else placement="bottom-start" show-arrow>
							<template #activator="{ toggle }">
								<button class="name" @click="toggle">
									<span>{{ getFieldPreview(element) }}</span>
								</button>
							</template>

							<v-field-list
								:collection="collection"
								:field="field"
								include-functions
								:include-relations="includeRelations"
								:relational-field-selectable="relationalFieldSelectable"
								:allow-select-all="false"
								@add="updateField(index, $event[0])"
							/>
						</v-menu>
						<v-select
							inline
							class="comparator"
							placement="bottom-start"
							:model-value="(filterInfo[index] as FilterInfoField).comparator"
							:items="getCompareOptions((filterInfo[index] as FilterInfoField).field)"
							@update:model-value="updateComparator(index, $event)"
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
								{{
									filterInfo[index].name === '_and'
										? t('interfaces.filter.logic_type_and')
										: t('interfaces.filter.logic_type_or')
								}}
							</span>
							<span class="text">
								{{
									`— ${filterInfo[index].name === '_and' ? t('interfaces.filter.all') : t('interfaces.filter.any')} ${t(
										'interfaces.filter.of_the_following'
									)}`
								}}
							</span>
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

<script setup lang="ts">
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { extractFieldFromFunction } from '@/utils/extract-field-from-function';
import { useSync } from '@directus/composables';
import {
	FieldFilter,
	FieldFilterOperator,
	FieldFunction,
	Filter,
	LogicalFilterAND,
	LogicalFilterOR,
	Type,
} from '@directus/types';
import { getFilterOperatorsForType, getOutputTypeForFunction, toArray } from '@directus/utils';
import { get } from 'lodash';
import { computed, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';
import InputGroup from './input-group.vue';
import { fieldToFilter, getComparator, getField, getNodeName } from './utils';

type FilterInfo = {
	id: number;
	isField: false;
	name: string;
	node: Filter;
};

type FilterInfoField = {
	id: number;
	isField: true;
	name: string;
	node: Filter;
	field: string;
	comparator: string;
};

interface Props {
	filter: Filter[];
	collection: string;
	field?: string;
	depth?: number;
	inline?: boolean;
	includeValidation?: boolean;
	includeRelations?: boolean;
	relationalFieldSelectable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	field: undefined,
	depth: 1,
	inline: false,
	includeValidation: false,
	includeRelations: true,
	relationalFieldSelectable: true,
});

const emit = defineEmits(['remove-node', 'update:filter', 'change']);

const { collection } = toRefs(props);
const filterSync = useSync(props, 'filter', emit);
const fieldsStore = useFieldsStore();
const relationsStore = useRelationsStore();
const { t } = useI18n();

const filterInfo = computed<(FilterInfo | FilterInfoField)[]>({
	get() {
		return props.filter.map((node, id) => {
			const name = getNodeName(node);
			const isField = name.startsWith('_') === false;

			return isField
				? ({
						id,
						isField,
						name,
						field: getField(node),
						comparator: getComparator(node),
						node,
				  } as FilterInfoField)
				: ({ id, name, isField, node } as FilterInfo);
		});
	},
	set(newVal) {
		emit(
			'update:filter',
			newVal.map((val) => val.node)
		);
	},
});

function getFieldPreview(node: Record<string, any>) {
	const fieldKey = getField(node);

	const fieldParts = fieldKey.split('.');

	const fieldNames = fieldParts.map((fieldKey, index) => {
		const hasFunction = fieldKey.includes('(') && fieldKey.includes(')');

		let key = fieldKey;
		let functionName;

		if (hasFunction) {
			const { field, fn } = extractFieldFromFunction(fieldKey);
			functionName = fn;
			key = field;
		}

		const pathPrefix = fieldParts.slice(0, index);
		const field = fieldsStore.getField(props.collection, [...pathPrefix, key].join('.'));

		const name = field?.name ?? key;

		if (hasFunction) {
			return t(`functions.${functionName}`) + ` (${name})`;
		}

		return name;
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
			// avoid setting value as string 'true'/'false' when switching from null/empty operators
			if (['_null', '_nnull', '_empty', '_nempty'].includes(nodeInfo.comparator)) {
				update(null);
			} else {
				update(Array.isArray(value) ? value[0] : value);
			}

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
	let type: Type;

	if (name.includes('(') && name.includes(')')) {
		const functionName = name.split('(')[0] as FieldFunction;
		type = getOutputTypeForFunction(functionName);
	} else {
		const fieldInfo = fieldsStore.getField(props.collection, name);
		type = fieldInfo?.type || 'unknown';

		// Alias uses the foreign key type
		if (type === 'alias') {
			const relations = relationsStore.getRelationsForField(props.collection, name);

			if (relations[0]) {
				type = fieldsStore.getField(relations[0].collection, relations[0].field)?.type || 'unknown';
			}
		}
	}

	return getFilterOperatorsForType(type, { includeValidation: props.includeValidation }).map((type) => ({
		text: t(`operators.${type}`),
		value: `_${type}`,
	}));
}

function isExistingField(node: Record<string, any>): boolean {
	if (!props.collection) return false;
	const fieldKey = getField(node);
	const field = fieldsStore.getField(props.collection, fieldKey);
	return !!field;
}
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

	.plain-name {
		display: inline-block;
		margin-right: 8px;
	}

	.name {
		white-space: nowrap;
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

		&:not(.disabled):hover::before {
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

.node {
	&.logic {
		padding-right: 4px;
		white-space: nowrap;
	}

	&.field {
		padding-right: 4px;
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
