<script setup lang="ts">
import type { FieldFilter, FieldFilterOperator } from '@directus/types';
import { computed } from 'vue';
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

const operatorOptions = computed(() =>
	JSON_FILTER_OPERATORS.map((operator) => ({
		text: t(`operators.${operator}`),
		value: `_${operator}`,
	})),
);

function updatePath(event: Event) {
	const path = (event.target as HTMLInputElement).value.replace(/^\.+/, '');
	emit('update:node', buildJsonFilter(parts.value.field, path, parts.value.operator, parts.value.value));
}

function updateOperator(operator: keyof FieldFilterOperator) {
	const value = initialValueForComparator(operator, parts.value.value, parts.value.operator);
	emit('update:node', buildJsonFilter(parts.value.field, parts.value.path, operator, value));
}

function updateValue(valueNode: FieldFilter) {
	const operatorValues = valueNode[JSON_VALUE_KEY] as FieldFilterOperator;
	const [operator = '_eq', value = null] = Object.entries(operatorValues)[0] ?? [];

	emit(
		'update:node',
		buildJsonFilter(
			parts.value.field,
			parts.value.path,
			operator as keyof FieldFilterOperator,
			coerceJsonFilterValue(value),
		),
	);
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
			<span>.</span>
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
			:model-value="parts.operator"
			:items="operatorOptions"
			@update:model-value="updateOperator"
		/>
		<InputGroup
			:field="parts.valueNode"
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
		margin-inline-end: 0.4375rem;
		font-weight: 700;
	}
}
</style>
