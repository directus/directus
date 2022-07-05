<template>
	<div class="metric type-title selectable" :class="{ 'has-header': showHeader }">
		<div :style="{ color }">
			<span class="prefix">{{ prefix }}</span>
			<span class="value">{{ displayValue }}</span>
			<span class="suffix">{{ suffix }}</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { Filter } from '@directus/shared/types';
import { abbreviateNumber } from '@directus/shared/utils';
import { cssVar } from '@directus/shared/utils/browser';
import { isNil } from 'lodash';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

interface Props {
	showHeader?: boolean;
	abbreviate?: boolean;
	sortField?: string;
	collection: string;
	field: string;
	function: string;
	filter?: Filter;
	data?: Record<string, any>[];
	decimals?: number;
	conditionalFormatting?: Record<string, any>[];
	prefix?: string | null;
	suffix?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
	showHeader: false,
	abbreviate: false,
	sortField: undefined,
	data: () => [],
	filter: () => ({}),
	decimals: 0,
	conditionalFormatting: () => [],
	prefix: null,
	suffix: null,
});

const { n } = useI18n();

const metric = computed(() => {
	if (!props.data || props.data.length === 0) return null;

	if (props.field) {
		if (props.function === 'first' || props.function === 'last') {
			if (typeof props.data[0][props.field] === 'string') {
				return props.data[0][props.field];
			} else {
				return Number(props.data[0][props.field]);
			}
		} else {
			return Number(props.data[0][props.function][props.field]);
		}
	} else {
		return Number(props.data[0][props.function]);
	}
});

const displayValue = computed(() => {
	if (isNil(metric.value)) return null;

	if (typeof metric.value === 'string') {
		return metric.value;
	}

	if (props.abbreviate) {
		return abbreviateNumber(metric.value, props.decimals ?? 0);
	}

	return n(Number(metric.value), 'decimal', {
		minimumFractionDigits: props.decimals ?? 0,
		maximumFractionDigits: props.decimals ?? 0,
	} as any);
});

const color = computed(() => {
	if (isNil(metric.value)) return null;

	let matchingFormat = null;

	for (const format of props.conditionalFormatting || []) {
		if (matchesOperator(format)) {
			matchingFormat = format;
		}
	}

	return matchingFormat ? matchingFormat.color || cssVar('--primary') : null;

	function matchesOperator(format: Record<string, any>) {
		if (typeof metric.value === 'string') {
			const value = metric.value;
			const compareValue = format.value ?? '';
			switch (format.operator || '>=') {
				case '=':
					return value === compareValue;
				case '!=':
					return value !== compareValue;
			}
		} else {
			const value = Number(metric.value);
			const compareValue = Number(format.value ?? 0);
			switch (format.operator || '>=') {
				case '=':
					return value === compareValue;
				case '!=':
					return value !== compareValue;
				case '>':
					return value > compareValue;
				case '>=':
					return value >= compareValue;
				case '<':
					return value < compareValue;
				case '<=':
					return value < compareValue;
			}
		}
	}
});
</script>

<style scoped>
.metric {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	font-weight: 800;
	font-size: 42px;
	line-height: 52px;
}

.metric.has-header {
	height: calc(100% - 16px);
}
</style>
