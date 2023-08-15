<template>
	<div ref="labelContainer" class="metric type-title selectable" :class="{ 'has-header': showHeader }">
		<p ref="labelText" :style="{ color }">
			{{ prefix }}
			{{ displayValue }}
			{{ suffix }}
		</p>
	</div>
</template>

<script setup lang="ts">
import { Filter } from '@directus/types';
import { abbreviateNumber } from '@directus/utils';
import { cssVar } from '@directus/utils/browser';
import { isNil } from 'lodash';
import { computed, ref, onMounted, onUpdated, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAutoFontFit } from '@/composables/use-auto-fit-text';

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

function updateFit() {
	adjustPadding();
	adjustFontSize();
}

onMounted(() => {
	const container = labelContainer.value;
	if (!container) return;

	updateFit();

	// Create a ResizeObserver to watch for changes in the container's dimensions
	resizeObserver = new ResizeObserver(() => {
		updateFit();
	});

	resizeObserver.observe(container);

	// Delay the initial font size adjustment to allow the text/font to render fully
	setTimeout(() => {
		updateFit();
	}, 500);
});

onUpdated(() => {
	updateFit();
});

onBeforeUnmount(() => {
	if (resizeObserver) {
		resizeObserver.disconnect();
		resizeObserver = null;
	}
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
	white-space: nowrap;
	line-height: 1.2;
}

/* .metric.has-header {
	height: calc(100% - 16px);
} */
</style>
