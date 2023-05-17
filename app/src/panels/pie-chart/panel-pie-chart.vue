<template>
	<div class="pie-chart">
		<div ref="chartEl" />
	</div>
</template>

<script setup lang="ts">
import { useFieldsStore } from '@/stores/fields';
import { PanelFunction, StringConditionalFillOperators } from '@/types/panels';
import { cssVar } from '@directus/utils/browser';
import ApexCharts from 'apexcharts';
import { isNil } from 'lodash';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { monoThemeGenerator } from './color-generator';

const props = withDefaults(
	defineProps<{
		showHeader?: boolean;
		collection: string;
		column: string;
		data?: Record<string, any>[];
		donut?: boolean;
		decimals?: number;
		function?: PanelFunction;
		legend?: 'none' | 'right' | 'bottom';
		showLabels?: boolean;
		color?: string;
		height: number;
		width: number;
		conditionalFill?: {
			operator: StringConditionalFillOperators;
			color: string;
			value: number;
		}[];
	}>(),
	{
		showHeader: false,
		data: () => [],
		donut: false,
		decimals: 0,
		function: 'count',
		legend: 'none',
		showLabels: false,
		color: cssVar('--primary'),
		conditionalFill: () => [],
	}
);

const { n } = useI18n();

const fieldsStore = useFieldsStore();

const chartEl = ref();
const chart = ref<ApexCharts>();

const isNumberColumn = computed(() => {
	if (!props.collection || !props.column) return false;
	const field = fieldsStore.getField(props.collection, props.column);
	if (!field?.type) return false;
	return ['integer', 'bigInteger', 'float', 'decimal'].includes(field.type);
});

watch(
	[
		() => props.data,
		() => props.color,
		() => props.donut,
		() => props.decimals,
		() => props.legend,
		() => props.showHeader,
		() => props.showLabels,
		() => props.conditionalFill,
		() => props.height,
		() => props.width,
	],
	() => {
		chart.value?.destroy();
		setupChart();
	},
	{ deep: true }
);

onMounted(fetchData);

onUnmounted(() => {
	chart.value?.destroy();
});

async function fetchData() {
	setupChart();
}

async function setupChart() {
	const labels: (string | number)[] = props.data.map((item) => {
		const label = item['group'][props.column];

		if (props.decimals === 0 || isNaN(Number(label))) {
			return props.legend === 'right' ? String(label).substring(0, 8) : String(label);
		}

		const translatedLabel = String(Number(label).toFixed(props.decimals));
		return props.legend === 'right' ? translatedLabel.substring(0, 5) : translatedLabel;
	});

	const series: number[] = props.data.map((item) => {
		const value = item[props.function][props.column];
		const currentValue = Number(value * 100);
		if (props.decimals === 0 || isNaN(currentValue)) return value;
		return Number(currentValue.toFixed(props.decimals));
	});

	const total = series.reduce((acc, val) => acc + val, 0);

	const baseColors: string[] = monoThemeGenerator(props.color ? props.color : cssVar('--primary'), labels.length);

	const colors = baseColors.map((baseColor, index) => formatColor(baseColor, series[index]));

	const size = props.height < props.width ? props.height * 20 : props.width * 20;

	let left = 20;
	let right = 20;
	let top = props.showHeader ? 10 : 0;
	let bottom = props.showHeader ? 40 : 30;
	let offsetY = props.showHeader ? -15 : 0;

	if (props.legend === 'right') {
		left = 0;
		right = -20;
	} else if (props.legend === 'bottom') {
		top = props.showHeader ? 10 : -5;
		bottom = props.showHeader ? 20 : 10;
		offsetY = props.showHeader ? -20 : -10;
	}

	chart.value = new ApexCharts(chartEl.value, {
		chart: {
			animation: {
				enabled: false,
			},
			type: props.donut ? 'donut' : 'pie',
			height: size,
			fontFamily: 'var(--family-sans-serif)',
			foreColor: 'var(--foreground-subdued)',
			selection: {
				enabled: false,
			},
		},
		states: {
			active: { filter: { type: 'none', value: 0 } },
		},
		series,
		labels,
		colors,
		grid: {
			borderColor: 'var(--border-subdued)',
			padding: {
				top,
				bottom,
				left,
				right,
			},
		},
		stroke: {
			show: false,
		},
		plotOptions: {
			pie: {
				offsetY: props.showHeader ? -15 : 20,
				dataLabels: {
					enabled: false,
				},
			},
		},
		tooltip: {
			followCursor: false,
			fillSeriesColor: false,
			theme: 'light',
			marker: {
				show: false,
			},
			x: {
				formatter: (value: number) => n(value / 100),
			},
			y: {
				title: {
					formatter: (seriesName: string) => `${seriesName}: `,
				},
				formatter: function (outOfOneHundred: number) {
					return `${getPercentage((outOfOneHundred / total) * 100)}% (${n(outOfOneHundred / 100)})`;
				},
			},
		},
		dataLabels: {
			enabled: props.showLabels,
			style: {
				fontSize: '10px',
			},
			formatter: function (val: number) {
				return `${getPercentage(val)}%`;
			},
		},
		legend: {
			show: props.legend !== 'none',
			position: props.legend !== 'none' ? props.legend : undefined,
			customLegendItems: labels,
			offsetX: props.legend === 'right' ? -25 : -((props.width - 4) * 5),
			offsetY,
			markers: {
				width: 8,
				height: 8,
			},
		},
	});

	chart.value.render();
}

function getPercentage(value: number) {
	return props.decimals && props.decimals >= 0 ? n(Number(value.toFixed(props.decimals))) : n(value);
}

function formatColor(color: string | number, value: string | number) {
	if (isNil(value) || props.conditionalFill.length === 0) return color;
	let formattedColor = color;

	for (const format of props.conditionalFill) {
		const shouldChangeColor = checkMatchingConditionalFill(value, format);
		if (shouldChangeColor) formattedColor = format.color;
	}

	return formattedColor;
}

function checkMatchingConditionalFill(
	value: string | number,
	format: (typeof props)['conditionalFill'][number]
): boolean {
	let baseValue: string | number = value;
	let compareValue: string | number = format.value;

	if (isNumberColumn.value) {
		if (isNaN(Number(value)) || isNaN(Number(format.value))) return false;
		baseValue = Number(value);
		compareValue = Number(format.value);
	}

	switch (format.operator || '>=') {
		case '=':
			return baseValue === compareValue;
		case '!=':
			return baseValue !== compareValue;
		case '>':
			return Number(baseValue) > compareValue;
		case '>=':
			return Number(baseValue) >= compareValue;
		case '<':
			return Number(baseValue) < compareValue;
		case '<=':
			return Number(baseValue) < compareValue;
		case 'contains':
			return typeof compareValue === 'string' && typeof baseValue === 'string'
				? (compareValue as string).includes(baseValue)
				: false;
		case 'ncontains':
			return typeof compareValue === 'string' && typeof baseValue === 'string'
				? !(compareValue as string).includes(baseValue)
				: false;
		default:
			return false;
	}
}
</script>

<style scoped>
.pie-chart {
	height: 100%;
	width: 100%;
}
</style>

<style>
.apexcharts-tooltip.apexcharts-theme-light {
	border-color: var(--border-normal) !important;
}

.apexcharts-tooltip.apexcharts-theme-light .apexcharts-tooltip-title {
	border-color: var(--border-normal) !important;
	margin-bottom: 0;
	padding: 0 4px;
	font-weight: 600 !important;
	font-size: 10px !important;
	background-color: var(--background-subdued) !important;
}

.apexcharts-tooltip-y-group {
	padding: 0 0 0 4px;
	font-weight: 600 !important;
	font-size: 10px !important;
}

.apexcharts-tooltip-series-group {
	background-color: var(--background-normal-alt) !important;
	padding: 0;
}

.apexcharts-tooltip-series-group .apexcharts-active {
	padding: 0 4px 0 0 !important;
}

.apexcharts-tooltip-series-group:last-child {
	padding-top: 0;
	padding-bottom: 0;
}

.apexcharts-tooltip-text {
	line-height: 1.5 !important;
	color: var(--foreground-normal);
}

.apexcharts-yaxistooltip {
	padding: 0 !important;
}
</style>
