<script setup lang="ts">
import type { FieldFilter, FieldFilterOperator } from '@directus/types';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import InputGroup from './input-group.vue';
import {
	buildJsonFilter,
	coerceJsonFilterValue,
	getJsonFilterParts,
	initialValueForComparator,
	JSON_FILTER_OPERATORS,
	JSON_VALUE_KEY,
} from './utils';
import VSelect from '@/components/v-select/v-select.vue';

const props = defineProps<{
	node: FieldFilter;
	fieldLabel: string;
	collection: string;
	variableInputEnabled?: boolean;
}>();

const emit = defineEmits<{
	'update:node': [node: FieldFilter];
}>();

const { t } = useI18n();
const parts = computed(() => getJsonFilterParts(props.node));

// A blank path collapses the node to an empty `_json: {}` (so incomplete drafts don't leak), which can't hold the
// operator/value and so an operator cannot be selected until a path is present. Having a pending operator and value allows selecting an operator with no path.
const pendingOperator = ref(parts.value.operator);
const pendingValue = ref(parts.value.value);

watch(parts, (newParts) => {
	if (newParts.path) {
		pendingOperator.value = newParts.operator;
		pendingValue.value = newParts.value;
	}
});

const valueNode = computed<FieldFilter>(() => ({
	[JSON_VALUE_KEY]: { [pendingOperator.value]: pendingValue.value },
}));

const operatorOptions = computed(() =>
	JSON_FILTER_OPERATORS.map((operator) => ({
		text: t(`operators.${operator}`),
		value: `_${operator}`,
	})),
);

function updatePath(event: Event) {
	const path = (event.target as HTMLInputElement).value.replace(/^\.+/, '');
	emit('update:node', buildJsonFilter(parts.value.field, path, pendingOperator.value, pendingValue.value));
}

function updateOperator(operator: keyof FieldFilterOperator) {
	const value = initialValueForComparator(operator, pendingValue.value, pendingOperator.value);
	pendingOperator.value = operator;
	pendingValue.value = value;
	emit('update:node', buildJsonFilter(parts.value.field, parts.value.path, operator, value));
}

function updateValue(updatedValueNode: FieldFilter) {
	const operatorValues = updatedValueNode[JSON_VALUE_KEY] as FieldFilterOperator;
	const [operator = '_eq', value = null] = Object.entries(operatorValues)[0] ?? [];
	const typedOperator = operator as keyof FieldFilterOperator;
	const coercedValue = coerceJsonFilterValue(value, typedOperator);

	pendingOperator.value = typedOperator;
	pendingValue.value = coercedValue;
	emit('update:node', buildJsonFilter(parts.value.field, parts.value.path, typedOperator, coercedValue));
}
</script>

<template>
	<div class="json-filter-node">
		<span class="field-label">
			{{ fieldLabel }}
			<span class="arrow">→</span>
			{{ $t('functions.json') }}
		</span>
		<label class="json-path">
			<input
				v-input-auto-width
				class="json-path-input"
				type="text"
				:value="parts.path"
				:aria-label="$t('functions.json')"
				placeholder="--"
				@input="updatePath"
			/>
		</label>
		<VSelect
			inline
			class="comparator"
			placement="bottom-start"
			:model-value="pendingOperator"
			:items="operatorOptions"
			@update:model-value="updateOperator"
		/>
		<InputGroup
			:field="valueNode"
			:collection="collection"
			:variable-input-enabled="variableInputEnabled"
			@update:field="updateValue"
		/>
	</div>
</template>

<style lang="scss" scoped>
.json-filter-node {
	display: flex;
	align-items: center;
	min-inline-size: 0;

	.field-label {
		margin-inline-end: 0.4375rem;
		font-weight: 700;
		white-space: nowrap;
	}

	.arrow {
		color: var(--theme--form--field--input--foreground-subdued);
	}

	.json-path {
		display: inline-flex;
		align-items: center;
		margin-inline-end: 0.4375rem;
		color: var(--theme--primary);
		font-family: var(--theme--fonts--monospace--font-family);
	}

	.json-path-input {
		max-inline-size: 40ch;
		color: var(--theme--primary);
		font-family: inherit;
		line-height: 1;
		background: transparent;
		border: none;

		&::placeholder {
			color: var(--theme--form--field--input--foreground-subdued);
		}
	}

	.comparator {
		font-weight: 700;

		:deep(.inline-display) {
			margin-inline-end: 0.4375rem;
		}
	}
}
</style>
