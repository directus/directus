<script setup lang="ts">
import { Filter } from '@directus/types';
import { isNil } from 'lodash';
import { computed, onBeforeUnmount, onMounted, onUpdated, ref } from 'vue';
import { CSSProperties } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAutoFontFit } from '@/composables/use-auto-fit-text';
import type { Notation, Style, Unit } from '@/utils/format-number';
import { formatNumber } from '@/utils/format-number';

interface Props {
	showHeader?: boolean;
	sortField?: string;
	collection: string;
	field: string;
	function: string;
	filter?: Filter;
	data?: Record<string, any>[];
	notation?: Notation;
	numberStyle?: Style;
	unit?: Unit;
	prefix?: string | null;
	suffix?: string | null;
	minimumFractionDigits?: number;
	maximumFractionDigits?: number;
	conditionalFormatting?: Record<string, any>[] | null;
	textAlign?: CSSProperties['text-align'];
	fontSize?: string;
	fontWeight?: number | undefined;
	fontStyle?: string | undefined;
	font?: 'sans-serif' | 'serif' | 'monospace';
}

const props = withDefaults(defineProps<Props>(), {
	showHeader: false,
	sortField: undefined,
	data: () => [],
	filter: () => ({}),
	notation: 'standard',
	numberStyle: 'decimal',
	unit: undefined,
	prefix: '',
	suffix: '',
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
	conditionalFormatting: () => [],
	fontSize: 'auto',
	fontWeight: 800,
	font: 'sans-serif',
	textAlign: 'center',
});

const { locale } = useI18n();

const labelContainer = ref<HTMLDivElement | null>(null);
const labelText = ref<HTMLParagraphElement | null>(null);

const { adjustFontSize } = useAutoFontFit(labelContainer, labelText);

let resizeObserver: ResizeObserver | null = null;

function adjustPadding() {
	const container = labelContainer.value;
	if (!container) return;

	const paddingWidth = container.offsetWidth * 0.05;
	const paddingHeight = container.offsetHeight * 0.05;

	const padding = Math.round(Math.max(8, Math.min(paddingWidth, paddingHeight)));

	if (props.showHeader == true) {
		container.style.padding = '0px 12px 12px 12px';
	} else {
		container.style.padding = `${padding}px`;
	}

	return;
}

function unmountResizeObserver() {
	if (resizeObserver) {
		resizeObserver.disconnect();
		resizeObserver = null;
	}
}

async function updateFit() {
	if (props.fontSize !== 'auto' || !props.data || props.data.length === 0) {
		unmountResizeObserver();
		return;
	}

	await document.fonts.ready;
	adjustPadding();
	adjustFontSize();

	if (!resizeObserver) {
		const container = labelContainer.value;
		if (!container) return;

		// Create a ResizeObserver to watch for changes in the container's dimensions
		resizeObserver = new ResizeObserver(() => {
			updateFit();
		});

		resizeObserver.observe(container);
	}

	adjustFontSize();
}

onMounted(() => {
	updateFit();
});

onUpdated(() => {
	updateFit();
});

onBeforeUnmount(() => {
	unmountResizeObserver();
});

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

function displayValue(value: number) {
	if (value === null || value === undefined) {
		return 0;
	}

	return formatNumber(Number(value), locale.value, {
		notation: props.notation,
		style: props.numberStyle,
		unit: props.unit,
		minimumFractionDigits: props.minimumFractionDigits,
		maximumFractionDigits: props.maximumFractionDigits,
		currency: props.numberStyle === 'currency' ? String(props.unit) : undefined,
	});
}

const color = computed(() => {
	if (isNil(metric.value)) return null;

	let matchingFormat = null;

	for (const format of props.conditionalFormatting || []) {
		if (matchesOperator(format)) {
			matchingFormat = format;
		}
	}

	return matchingFormat?.color || 'var(--theme--primary)';

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

		return false;
	}
});
</script>

<template>
	<div ref="labelContainer" class="metric type-title" :class="[font, { 'has-header': showHeader }]">
		<p
			ref="labelText"
			class="metric-text"
			:style="{ color, fontWeight, textAlign, fontStyle, fontSize: fontSize !== 'auto' ? fontSize : undefined }"
		>
			{{ prefix }}
			{{ displayValue(metric) }}
			{{ suffix }}
		</p>
	</div>
</template>

<style lang="scss" scoped>
.metric-text {
	min-inline-size: min-content;
	min-block-size: min-content;
	inline-size: 100%;
}

.metric {
	display: flex;
	align-items: center;
	inline-size: 100%;
	block-size: 100%;
	font-weight: 800;
	white-space: nowrap;
	line-height: 1.2;
	padding: 12px;

	&.sans-serif {
		font-family: var(--theme--fonts--sans--font-family);
	}

	&.serif {
		font-family: var(--theme--fonts--serif--font-family);
	}

	&.monospace {
		font-family: var(--theme--fonts--monospace--font-family);
	}
}
</style>
