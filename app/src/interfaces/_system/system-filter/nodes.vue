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
import {
	fieldHasFunction,
	fieldToFilter,
	getComparator,
	getField,
	getNodeName,
	stripRelationshipPrefix,
} from './utils';

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
	isNoneGroup?: boolean;
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
	rawFieldNames?: boolean;
	variableInputEnabled: boolean | undefined;
}

const props = withDefaults(defineProps<Props>(), {
	field: undefined,
	depth: 1,
	inline: false,
	includeValidation: false,
	includeRelations: true,
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

			if (isField) {
				const field = getField(node);
				const comparator = getComparator(node);
				const isNoneGroup = comparator === '_none';

				return {
					id,
					isField,
					name,
					field,
					comparator,
					node,
					isNoneGroup,
				} as FilterInfoField;
			}

			return { id, name, isField, node } as FilterInfo;
		});
	},
	set(newVal) {
		emit(
			'update:filter',
			newVal.map((val) => val.node),
		);
	},
});

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
	if (!nodeInfo || nodeInfo.isField === false) return;
	const fieldInfo = nodeInfo as FilterInfoField;

	const valuePath = fieldInfo.field + '.' + fieldInfo.comparator;
	const value = get(fieldInfo.node, valuePath);

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
		if (!nodeInfo || nodeInfo.isField === false) return;
		const fieldInfo = nodeInfo as FilterInfoField;

		filterSync.value = filterSync.value.map((filter, filterIndex) => {
			if (filterIndex === index) return fieldToFilter(fieldInfo.field, operator, value);
			return filter;
		});
	}
}

function updateField(index: number, newField: string) {
	const nodeInfo = filterInfo.value[index];
	if (!nodeInfo || nodeInfo.isField === false) return;
	const fieldInfo = nodeInfo as FilterInfoField;

	const oldFieldInfo = fieldsStore.getField(props.collection, fieldInfo.name);
	const newFieldInfo = fieldsStore.getField(props.collection, newField);

	const valuePath = fieldInfo.field + '.' + fieldInfo.comparator;
	let value = get(fieldInfo.node, valuePath);
	let comparator = fieldInfo.comparator;

	if (oldFieldInfo?.type !== newFieldInfo?.type) {
		value = null;
		const compareOptions = getCompareOptions(newField);
		comparator = compareOptions[0]?.value || '_eq';
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
				const relatedField = fieldsStore.getField(relations[0].collection, relations[0].field);
				type = relatedField?.type || 'unknown';
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

/**
 * Gets the target collection for filtering when using an alias field (o2m, m2m).
 *
 * This function is specifically used in filter contexts where you need to determine
 * which collection to use for nested filters when filtering by a relational alias field.
 * For example, when filtering by a "posts" alias field (o2m) on a "users" collection,
 * the target collection would be "posts" since that's where the actual filter conditions
 * should be applied.
 *
 * @param fieldPath - The path to the alias field (e.g., "posts" or "categories")
 * @returns The target collection name for filtering, or null if:
 *   - The collection is not provided
 *   - The field doesn't exist
 *   - The field is not an alias field
 *   - The relation type is not o2m or m2m
 */
function getRelatedCollectionForField(fieldPath: string): string | null {
	if (!props.collection) return null;

	const field = fieldsStore.getField(props.collection, fieldPath);
	if (!field) return null;

	// For alias fields (o2m, m2m), get the related collection
	if (field.type !== 'alias') return null;
	const relations = relationsStore.getRelationsForField(props.collection, fieldPath);

	if (relations[0]) {
		return relations[0].collection;
	}

	return null;
}

function handleNoneGroupFilter(index: number, newFilters: Filter[]) {
	const nodeInfo = filterInfo.value[index];
	if (!nodeInfo || !nodeInfo.isField || !(nodeInfo as FilterInfoField).isNoneGroup) return;
	const fieldInfo = nodeInfo as FilterInfoField;

	const relationshipField = fieldInfo.field;
	// Filters within _none should NOT have the relationship prefix in the stored JSON
	// The backend handles the relationship context automatically
	// Note: Nested relationship filters (e.g., groupId: { status: { _eq: ... } }) should be
	// preserved as-is since they're already correctly structured for the collection context
	const filtersWithoutPrefix = stripRelationshipPrefix(newFilters, relationshipField);

	// _none expects a single Filter object with flat fields (not wrapped in _and)
	// Multiple conditions are implicitly ANDed by having multiple top-level fields
	// Merge all filters into a single flat object
	let noneFilter: Filter = {};

	if (filtersWithoutPrefix.length > 0) {
		for (const filter of filtersWithoutPrefix) {
			if (filter && typeof filter === 'object') {
				noneFilter = { ...noneFilter, ...filter };
			}
		}
	}

	// Update the node with the new filters
	filterSync.value = filterSync.value.map((filter, filterIndex) => {
		if (filterIndex === index) {
			return {
				[relationshipField]: {
					_none: noneFilter,
				},
			} as any;
		}

		return filter;
	});
}

function handleNoneGroupRemoveNode(index: number, removeIds: string[]) {
	const nodeInfo = filterInfo.value[index];
	if (!nodeInfo || !nodeInfo.isField) return;
	const fieldInfo = nodeInfo as FilterInfoField;
	if (!fieldInfo.isNoneGroup) return;

	const currentFilters = getNoneGroupFilters(fieldInfo);
	const removeIndex = Number(removeIds[0]);
	const newFilters = currentFilters.filter((_, i) => i !== removeIndex);
	handleNoneGroupFilter(index, newFilters);
}

function getNoneGroupFilters(nodeInfo: FilterInfoField): Filter[] {
	if (!nodeInfo.isNoneGroup) return [];

	const noneFilter = get(nodeInfo.node, `${nodeInfo.field}._none`, {}) as Filter;
	const relationshipField = nodeInfo.field;

	if (!noneFilter || Object.keys(noneFilter).length === 0) return [];

	// Strip prefix for display (in case it exists from old data or was accidentally added)
	// Filters within _none should not have the prefix in stored JSON
	const strippedFilters = stripRelationshipPrefix([noneFilter], relationshipField);
	const strippedFilter = strippedFilters[0];

	if (!strippedFilter) return [];

	// _none filters use flat objects with multiple fields (not _and/_or)
	// Convert the flat object into an array of single-field filters for the nodes component
	// Each top-level key becomes its own filter
	const fieldFilters: Filter[] = [];

	for (const [key, value] of Object.entries(strippedFilter)) {
		if (key !== '_and' && key !== '_or' && value !== undefined) {
			fieldFilters.push({ [key]: value } as Filter);
		}
	}

	return fieldFilters;
}

function handleNoneGroupAddField(index: number, fieldKey: string) {
	const nodeInfo = filterInfo.value[index];
	if (!nodeInfo || !nodeInfo.isField || !(nodeInfo as FilterInfoField).isNoneGroup) return;
	const fieldInfo = nodeInfo as FilterInfoField;

	const relatedCollection = getRelatedCollectionForField(fieldInfo.field) || props.collection;
	const currentFilters = getNoneGroupFilters(fieldInfo);

	// Create a new filter node for the selected field
	const field = fieldsStore.getField(relatedCollection, fieldKey);
	if (!field) return;

	const fieldType = field.type || 'unknown';
	const filterOperators = getFilterOperatorsForType(fieldType, { includeValidation: props.includeValidation });
	const operator = filterOperators[0] || 'eq';
	const booleanOperators: string[] = ['empty', 'nempty', 'null', 'nnull'];
	const initialValue = booleanOperators.includes(operator) ? true : null;

	// Create filter with the field key (without prefix, will be added automatically)
	const newFilter = fieldToFilter(fieldKey, `_${operator}`, initialValue);
	const updatedFilters = [...currentFilters, newFilter];

	handleNoneGroupFilter(index, updatedFilters);
}
</script>

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
		v-bind="{ 'force-fallback': true }"
		@change="$emit('change')"
	>
		<template #item="{ element, index }">
			<li class="row">
				<!-- _none group -->
				<template v-if="filterInfo[index]?.isField && (filterInfo[index] as FilterInfoField).isNoneGroup">
					<div class="node none-group">
						<div class="header" :class="{ inline }">
							<v-icon name="drag_indicator" class="drag-handle" small />
							<div class="logic-type none">
								<span class="key">{{ getFieldPreview(element) }}</span>
								<span class="text">
									{{ `— ${$t('interfaces.filter.none_of_the_following')}` }}
								</span>
							</div>
							<v-menu placement="bottom-start" show-arrow>
								<template #activator="{ toggle }">
									<v-icon
										v-tooltip="$t('interfaces.filter.add_filter')"
										name="add"
										class="add-filter"
										small
										clickable
										@click="toggle"
									/>
								</template>
								<v-field-list
									:collection="getRelatedCollectionForField((filterInfo[index] as FilterInfoField).field) || collection"
									include-functions
									:include-relations="includeRelations"
									:relational-field-selectable="relationalFieldSelectable"
									:allow-select-all="false"
									:raw-field-names="rawFieldNames"
									@add="handleNoneGroupAddField(index, $event[0])"
								/>
							</v-menu>
							<span class="delete">
								<v-icon
									v-tooltip="$t('delete_label')"
									name="close"
									small
									clickable
									@click="$emit('remove-node', [index])"
								/>
							</span>
						</div>
						<nodes
							:filter="getNoneGroupFilters(filterInfo[index] as FilterInfoField)"
							:collection="getRelatedCollectionForField((filterInfo[index] as FilterInfoField).field) || collection"
							:depth="depth + 1"
							:inline="inline"
							:raw-field-names="rawFieldNames"
							:variable-input-enabled="variableInputEnabled"
							:include-validation="includeValidation"
							:include-relations="includeRelations"
							:relational-field-selectable="relationalFieldSelectable"
							@change="$emit('change')"
							@remove-node="handleNoneGroupRemoveNode(index, $event)"
							@update:filter="handleNoneGroupFilter(index, $event)"
						/>
					</div>
				</template>

				<!-- Regular field filter -->
				<template v-else-if="filterInfo[index]?.isField && !(filterInfo[index] as FilterInfoField).isNoneGroup">
					<div block class="node field">
						<div class="header" :class="{ inline, 'raw-field-names': rawFieldNames }">
							<v-icon name="drag_indicator" class="drag-handle" small></v-icon>
							<span v-if="field || !isExistingField(element)" class="plain-name">
								{{ getFieldPreview(element) }}
							</span>
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
									:raw-field-names="rawFieldNames"
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
							<input-group
								:field="element"
								:collection="collection"
								:variable-input-enabled="variableInputEnabled"
								@update:field="replaceNode(index, $event)"
							/>
							<span class="delete">
								<v-icon
									v-tooltip="$t('delete_label')"
									name="close"
									small
									clickable
									@click="$emit('remove-node', [index])"
								/>
							</span>
						</div>
					</div>
				</template>

				<!-- Logical group (_and/_or) -->
				<template v-else-if="filterInfo[index] && !filterInfo[index].isField">
					<div class="node logic">
						<div class="header" :class="{ inline }">
							<v-icon name="drag_indicator" class="drag-handle" small />
							<div class="logic-type" :class="{ or: filterInfo[index].name === '_or' }">
								<span class="key" @click="toggleLogic(index)">
									{{
										filterInfo[index].name === '_and'
											? $t('interfaces.filter.logic_type_and')
											: $t('interfaces.filter.logic_type_or')
									}}
								</span>
								<span class="text">
									{{
										`— ${filterInfo[index].name === '_and' ? $t('interfaces.filter.all') : $t('interfaces.filter.any')} ${t(
											'interfaces.filter.of_the_following',
										)}`
									}}
								</span>
							</div>
							<span class="delete">
								<v-icon
									v-tooltip="$t('delete_label')"
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
							:raw-field-names="rawFieldNames"
							:variable-input-enabled="variableInputEnabled"
							@change="$emit('change')"
							@remove-node="$emit('remove-node', [`${index}.${filterInfo[index].name}`, ...$event])"
							@update:filter="replaceNode(index, { [filterInfo[index].name]: $event })"
						/>
					</div>
				</template>
			</li>
		</template>
	</draggable>
</template>

<style lang="scss" scoped>
.header {
	position: relative;
	display: flex;
	align-items: center;
	inline-size: fit-content;
	margin-inline-end: 18px;
	margin-block-end: 8px;
	padding: 2px 6px;
	padding-inline-end: 8px;
	background-color: var(--theme--form--field--input--background);
	border: var(--theme--border-width) solid var(--theme--border-color-subdued);
	border-radius: 100px;
	transition: border-color var(--fast) var(--transition);

	.logic-type {
		color: var(--theme--form--field--input--foreground-subdued);

		.key {
			margin-inline-end: 4px;
			padding: 2px 6px;
			color: var(--theme--primary);
			background-color: var(--theme--primary-background);
			border-radius: 6px;
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

		&.none .key {
			color: var(--theme--danger);
			background-color: var(--theme--danger-background);
			cursor: default;

			&:hover {
				background-color: var(--theme--danger-subdued);
			}
		}
	}

	.add-filter {
		--v-icon-color: var(--theme--primary);
		--v-icon-color-hover: var(--theme--primary-accent);

		margin-inline-start: 8px;
	}

	:deep(.inline-display) {
		padding-inline-end: 0;

		.v-icon {
			display: none;
		}
	}

	.plain-name {
		display: inline-block;
		margin-inline-end: 8px;
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
		margin-inline-end: 8px;

		&::before {
			position: absolute;
			inset-block-start: 0;
			inset-inline-start: -4px;
			z-index: -1;
			inline-size: calc(100% + 8px);
			block-size: 100%;
			background-color: var(--theme--background-normal);
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
		--v-icon-color: var(--theme--form--field--input--foreground-subdued);
		--v-icon-color-hover: var(--theme--danger);

		position: absolute;
		inset-block-start: 50%;
		inset-inline-start: 100%;
		padding-inline-start: 4px;
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

		margin-inline-end: 4px;
		cursor: grab;
	}

	&.inline {
		inline-size: auto;
		margin-inline-end: 0;
		padding-inline-end: 12px;

		.delete {
			inset-inline-end: 8px;
			inset-inline-start: unset;
			background-color: var(--theme--background);
		}
	}
}

.node {
	&.logic {
		padding-inline-end: 4px;
		white-space: nowrap;
	}

	&.field {
		padding-inline-end: 4px;
	}
}

.group :deep(.sortable-ghost) {
	.node .header {
		background-color: var(--theme--primary-background);
		border-color: var(--theme--form--field--input--border-color-focus);

		> * {
			opacity: 0;
		}
	}
}
</style>
