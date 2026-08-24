<script setup lang="ts">
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
import { getFilterOperatorsForType, getOutputTypeForFunction } from '@directus/utils';
import { get } from 'lodash';
import { computed, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';
import InputGroup from './input-group.vue';
import JsonFilterNode from './json-filter-node.vue';
import {
	buildJsonFilter,
	fieldHasFunction,
	fieldToFilter,
	getComparator,
	getField,
	getNodeName,
	initialValueForComparator,
	isJsonFilter,
} from './utils';
import VFieldList from '@/components/v-field-list/v-field-list.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VMenu from '@/components/v-menu.vue';
import VSelect from '@/components/v-select/v-select.vue';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { extractFieldFromFunction } from '@/utils/extract-field-from-function';

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
	/** Resolved by system-filter.vue; when false, `_json` nodes cannot be created here */
	includeJsonFunction?: boolean;
	relationalFieldSelectable?: boolean;
	rawFieldNames?: boolean;
	variableInputEnabled: boolean | undefined;
}

const props = withDefaults(defineProps<Props>(), {
	field: undefined,
	depth: 1,
	inline: false,
	includeValidation: false,
	includeRelations: true,
	includeJsonFunction: true,
	relationalFieldSelectable: true,
	rawFieldNames: false,
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
			newVal.map((val) => val.node),
		);
	},
});

function nodeInfoAt(index: number): FilterInfo | FilterInfoField {
	return filterInfo.value[index]!;
}

function fieldInfoAt(index: number): FilterInfoField {
	return nodeInfoAt(index) as FilterInfoField;
}

function getFieldPreview(node: Record<string, any>) {
	const fieldKey = getField(node);
	const fieldParts = fieldKey.split('.');

	const fieldNames = fieldParts.map((fieldKey, index) => {
		const hasFunction = fieldHasFunction(fieldKey);

		let key = fieldKey;
		let functionName;

		if (hasFunction) {
			const { field, fn } = extractFieldFromFunction(fieldKey);
			functionName = fn;
			key = field;
		}

		const pathPrefix = fieldParts.slice(0, index);
		const field = fieldsStore.getField(props.collection, [...pathPrefix, key].join('.'));

		// Injected special fields, such as $version
		if (!field && key.startsWith('$')) {
			return t(key.replace('$', ''));
		}

		const name = (props.rawFieldNames ? field?.field : field?.name) ?? key;

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

	if (!nodeInfo || nodeInfo.isField) return;

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
	if (!nodeInfo?.isField) return;
	if (operator === '_json') return;

	const valuePath = nodeInfo.field + '.' + nodeInfo.comparator;
	const value = get(nodeInfo.node, valuePath);

	update(initialValueForComparator(operator, value, nodeInfo.comparator));

	function update(value: any) {
		if (!nodeInfo?.isField) return;

		filterSync.value = filterSync.value.map((filter, filterIndex) => {
			if (filterIndex === index) return fieldToFilter(nodeInfo.field, operator, value);
			return filter;
		});
	}
}

function updateField(index: number, newField: string) {
	const nodeInfo = filterInfo.value[index];
	if (!nodeInfo?.isField) return;

	const functionInfo = extractFieldFromFunction(newField);

	if (functionInfo.fn === 'json') {
		// getOutputTypeForFunction has no mapping for "json", so there is no generic fallback
		if (!props.includeJsonFunction) return;

		filterSync.value = filterSync.value.map((filter, filterIndex) => {
			if (filterIndex === index) return buildJsonFilter(functionInfo.field, '', '_eq', null);
			return filter;
		});

		return;
	}

	const oldFieldInfo = fieldsStore.getField(props.collection, nodeInfo.name);
	const newFieldInfo = fieldsStore.getField(props.collection, newField);
	const valuePath = nodeInfo.field + '.' + nodeInfo.comparator;
	let value = get(nodeInfo.node, valuePath);
	let comparator = nodeInfo.comparator;

	if (oldFieldInfo?.type !== newFieldInfo?.type) {
		value = null;
		comparator = getCompareOptions(newField)[0]?.value ?? '_eq';
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

	if (name === '$version') {
		type = 'string';
	} else if (fieldHasFunction(name)) {
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

	return getFilterOperatorsForType(type, { includeValidation: props.includeValidation })
		.filter((operator) => operator !== 'json')
		.map((type) => ({
			text: t(`operators.${type}`),
			value: `_${type}`,
		}));
}

function isExistingField(node: Record<string, any>): boolean {
	if (!props.collection) return false;
	let fieldKey = getField(node);

	if (fieldHasFunction(fieldKey)) {
		const keyParts = fieldKey.split('.');
		// the function is always in the last key part
		const { field } = extractFieldFromFunction(keyParts.at(-1)!);
		fieldKey = [...keyParts.slice(0, -1), field].join('.');
	}

	const field = fieldsStore.getField(props.collection, fieldKey);
	return !!field;
}
</script>

<template>
	<Draggable
		tag="ul"
		draggable=".row"
		handle=".drag-handle"
		class="group"
		:list="filterSync"
		:group="{ name: 'g1' }"
		:item-key="getIndex"
		:swap-threshold="0.3"
		v-bind="{ 'force-fallback': true }"
		@change="$emit('change')"
	>
		<template #item="{ element, index }">
			<li class="row">
				<div v-if="nodeInfoAt(index).isField" block class="node field">
					<div class="header" :class="{ inline, 'raw-field-names': rawFieldNames }">
						<VIcon name="drag_indicator" class="drag-handle" small></VIcon>
						<JsonFilterNode
							v-if="isJsonFilter(element)"
							:node="element"
							:field-label="getFieldPreview(element)"
							:collection="collection"
							:variable-input-enabled="variableInputEnabled"
							@update:node="replaceNode(index, $event)"
						/>
						<template v-else>
							<span v-if="field || !isExistingField(element)" class="plain-name">
								{{ getFieldPreview(element) }}
							</span>
							<VMenu v-else placement="bottom-start" show-arrow>
								<template #activator="{ toggle }">
									<button class="name" @click="toggle">
										<span>{{ getFieldPreview(element) }}</span>
									</button>
								</template>

								<VFieldList
									:collection="collection"
									:field="field"
									include-functions
									:excluded-functions="includeJsonFunction ? [] : ['json']"
									:include-relations="includeRelations"
									:relational-field-selectable="relationalFieldSelectable"
									:allow-select-all="false"
									:raw-field-names="rawFieldNames"
									@add="updateField(index, $event[0])"
								/>
							</VMenu>
							<VSelect
								inline
								class="comparator"
								placement="bottom-start"
								:model-value="fieldInfoAt(index).comparator"
								:items="getCompareOptions(fieldInfoAt(index).field)"
								@update:model-value="updateComparator(index, $event)"
							/>
							<InputGroup
								:field="element"
								:collection="collection"
								:variable-input-enabled="variableInputEnabled"
								@update:field="replaceNode(index, $event)"
							/>
						</template>
						<span class="delete">
							<VIcon
								v-tooltip="$t('delete_label')"
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
						<VIcon name="drag_indicator" class="drag-handle" small />
						<div class="logic-type" :class="{ or: nodeInfoAt(index).name === '_or' }">
							<span class="key" @click="toggleLogic(index)">
								{{
									nodeInfoAt(index).name === '_and'
										? $t('interfaces.filter.logic_type_and')
										: $t('interfaces.filter.logic_type_or')
								}}
							</span>
							<span class="text">
								{{
									`— ${nodeInfoAt(index).name === '_and' ? $t('interfaces.filter.all') : $t('interfaces.filter.any')} ${t(
										'interfaces.filter.of_the_following',
									)}`
								}}
							</span>
						</div>
						<span class="delete">
							<VIcon
								v-tooltip="$t('delete_label')"
								name="close"
								small
								clickable
								@click="$emit('remove-node', [index])"
							/>
						</span>
					</div>
					<Nodes
						:filter="element[nodeInfoAt(index).name]"
						:collection="collection"
						:depth="depth + 1"
						:inline="inline"
						:include-json-function="includeJsonFunction"
						:raw-field-names="rawFieldNames"
						:variable-input-enabled="variableInputEnabled"
						@change="$emit('change')"
						@remove-node="$emit('remove-node', [`${index}.${nodeInfoAt(index).name}`, ...$event])"
						@update:filter="replaceNode(index, { [nodeInfoAt(index).name]: $event })"
					/>
				</div>
			</li>
		</template>
	</Draggable>
</template>

<style lang="scss" scoped>
.header {
	position: relative;
	display: flex;
	align-items: center;
	inline-size: fit-content;
	margin-inline-end: 1rem;
	margin-block-end: 0.4375rem;
	padding: 0.125rem 0.3125rem;
	padding-inline-end: 0.4375rem;
	background-color: var(--theme--form--field--input--background);
	border: var(--theme--border-width) solid var(--theme--border-color-subdued);
	border-radius: 5.625rem;
	transition: border-color var(--fast) var(--transition);

	.logic-type {
		color: var(--theme--form--field--input--foreground-subdued);

		.key {
			margin-inline-end: 0.25rem;
			padding: 0.125rem 0.3125rem;
			color: var(--theme--primary);
			background-color: var(--theme--primary-background);
			border-radius: 0.3125rem;
			cursor: pointer;
			transition: var(--fast) var(--transition);
			transition-property: color, background-color;

			&:hover {
				background-color: var(--theme--primary-subdued);
			}
		}

		&.or .key {
			color: var(--theme--secondary);
			background-color: var(--secondary-alt);

			&:hover {
				background-color: var(--secondary-25);
			}
		}
	}

	:deep(.inline-display) {
		padding-inline-end: 0;

		.v-icon {
			display: none;
		}
	}

	.plain-name {
		display: inline-block;
		margin-inline-end: 0.4375rem;
		white-space: nowrap;
	}

	.name {
		white-space: nowrap;
	}

	&.raw-field-names {
		.plain-name,
		.name {
			font-family: var(--theme--fonts--monospace--font-family);
		}
	}

	.name,
	.comparator {
		position: relative;
		z-index: 2;
		display: inline-block;
		margin-inline-end: 0.4375rem;

		&::before {
			position: absolute;
			inset-block-start: 0;
			inset-inline-start: -0.25rem;
			z-index: -1;
			inline-size: calc(100% + 0.4375rem);
			block-size: 100%;
			background-color: var(--theme--background-normal);
			border-radius: 0.3125rem;
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
		--v-icon-color: var(--theme--form--field--input--foreground-subdued);
		--v-icon-color-hover: var(--theme--danger);

		position: absolute;
		inset-block-start: 50%;
		inset-inline-start: 100%;
		z-index: 3;
		padding-inline-start: 0.25rem;
		transform: translateY(-50%);
		opacity: 0;
		transition: opacity var(--fast) var(--transition);
	}

	&:focus-within,
	&:hover {
		.delete {
			opacity: 1;
		}
	}

	&:hover {
		border-color: var(--theme--form--field--input--border-color);
	}

	.drag-handle {
		--v-icon-color: var(--theme--form--field--input--foreground-subdued);

		margin-inline-end: 0.25rem;
		cursor: grab;
	}

	&.inline {
		inline-size: auto;
		margin-inline-end: 0;
		padding-inline-end: 0.6875rem;

		.delete {
			inset-inline-end: 0.4375rem;
			inset-inline-start: unset;
			background-color: var(--theme--background);
		}
	}
}

.node {
	&.logic {
		padding-inline-end: 0.25rem;
		white-space: nowrap;
	}

	&.field {
		padding-inline-end: 0.25rem;
	}
}

.group :deep(.sortable-ghost) {
	.node .header {
		background-color: var(--theme--primary-background);
		border-color: var(--theme--primary);

		> * {
			opacity: 0;
		}
	}
}
</style>
