<template>
	<div class="bar-chart">
		<div ref="chartEl" />
	</div>
</template>

<script setup lang="ts">
import { useFieldsStore } from '@/stores/fields';
import { PanelFunction, StringConditionalFillOperators } from '@/types/panels';
import type { Filter } from '@directus/types';
import { cssVar } from '@directus/utils/browser';
import ApexCharts from 'apexcharts';
import { isNil, snakeCase } from 'lodash';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
	defineProps<{
		showHeader?: boolean;
		height: number;
		data?: Record<string, any>[];
		collection: string;
		horizontal?: boolean;
		xAxis: string;
		function?: PanelFunction;
		yAxis: string;
		decimals?: number;
		color?: string;
		filter?: Filter;
		showAxisLabels?: string;
		showDataLabel?: boolean;
		conditionalFill?: {
			axis: 'X' | 'Y';
			operator: StringConditionalFillOperators;
			color: string;
			value: number;
		}[];
	}>(),
	{
		showHeader: false,
		data: () => [],
		horizontal: false,
		decimals: 2,
		color: cssVar('--primary'),
		function: 'max',
		filter: () => ({}),
		showAxisLabels: 'both',
		showDataLabel: true,
		conditionalFill: () => [],
	}
);

const { t, n } = useI18n();

const fieldsStore = useFieldsStore();

const chartEl = ref();
const chart = ref<ApexCharts>();

const yAxisLabel = computed(() => {
	const field = fieldsStore.getField(props.collection, props.yAxis)!;

	if (!props.function) return `${field.name}`;

	const operation = t(snakeCase(props.function));
	return `${field?.name} (${operation})`;
});

watch(
	[
		() => props.data,
		() => props.horizontal,
		() => props.decimals,
		() => props.color,
		() => props.showAxisLabels,
		() => props.conditionalFill,
	],
	() => {
		chart.value?.destroy();
		setUpChart();
	},
	{ deep: true }
);

onMounted(setUpChart);

onUnmounted(() => {
	chart.value?.destroy();
});

const formatNumericValue = (val: any) => {
	if (typeof val === 'number') return n(val);
	return val;
};

function setUpChart() {
	const metrics = props.data
		.map((metric) => {
			const x = metric['group']?.[props.xAxis];
			if (!x) return null;

			const yValue = props.function ? Number(metric?.[props.function]?.[props.yAxis]) : Number(metric?.[props.yAxis]);
			const y = props.decimals >= 0 ? yValue.toFixed(props.decimals) : yValue;
			if (isNaN(yValue)) return null;

			return {
				fillColor: getFillColor(x, y),
				x: formatNumericValue(x),
				y,
			};
		})
		.filter((metric) => metric) as Record<string, any>[];

	chart.value = new ApexCharts(chartEl.value, {
		chart: {
			animations: {
				enabled: false,
			},
			type: 'bar',
			height: '100%',
			width: '100%',
			toolbar: { show: false },
			fontFamily: 'var(--family-sans-serif)',
			foreColor: 'var(--foreground-subdued)',
			selection: { enabled: false },
			zoom: { enabled: false },
		},
		states: {
			normal: { filter: { type: 'none' } },
			hover: { filter: { type: 'none' } },
			active: { filter: { type: 'none' } },
		},
		series: [{ data: metrics }],
		fill: {
			type: 'solid',
			opacity: 1,
		},
		grid: {
			borderColor: 'var(--border-subdued)',
			padding: {
				top: props.showHeader ? -20 : -5,
				bottom: 5,
				left: 10,
				right: 20,
			},
			xaxis: {
				lines: {
					show: props.horizontal,
				},
			},
			yaxis: {
				lines: {
					show: !props.horizontal,
				},
			},
		},
		plotOptions: {
			dataLabels: {
				enabled: false,
			},
			bar: {
				borderRadius: 4,
				horizontal: props.horizontal,
				columnWidth: '67%',
				barHeight: '67%',
			},
		},
		dataLabels: {
			enabled: props.showDataLabel,
			formatter: formatNumericValue,
			// style: {
			// 	colors: ['var(--foreground-normal-alt'],
			// },
		},
		tooltip: {
			marker: {
				show: false,
			},
			x: {
				formatter: (value: any) => formatNumericValue(value) + ': ',
			},
			y: {
				title: {
					formatter: () => yAxisLabel.value + ': ',
				},
				formatter: formatNumericValue,
			},
		},
		xaxis: {
			type: 'category',
			toolbar: false,
			axisBorder: {
				show: !props.horizontal,
				height: 0.5,
				width: '1px',
				color: 'var(--border-subdued)',
			},
			axisTicks: {
				show: false,
			},
			labels: {
				show: ['both', 'xOnly'].includes(props.showAxisLabels),
				rotate: 0,
				showDuplicates: true,
				style: {
					fontFamily: 'var(--family-sans-serif)',
					foreColor: 'var(--foreground-subdued)',
					fontWeight: 600,
					fontSize: '10px',
				},
				trim: true,
				hideOverlappingLabels: true,
			},
			dataLabels: {
				formatter: formatNumericValue,
				orientation: 'horizontal',
				hideOverflowingLabels: true,
			},
		},
		yaxis: {
			forceNiceScale: true,
			tickAmount: 0,
			axisBorder: {
				show: props.horizontal,
				height: 0.5,
				width: '1px',
				color: 'var(--border-subdued)',
			},
			axisTicks: {
				show: false,
			},
			labels: {
				show: ['both', 'yOnly'].includes(props.showAxisLabels),
				formatter: formatNumericValue,
				style: {
					fontFamily: 'var(--family-sans-serif)',
					foreColor: 'var(--foreground-subdued)',
					fontWeight: 600,
					fontSize: '10px',
				},
			},
		},
	});

	chart.value.render();

	function getFillColor(x: string | number, y: string | number) {
		if (isNil(x) || isNil(y) || props.conditionalFill.length === 0) return props.color;
		let fillColor = props.color;

		for (const format of props.conditionalFill) {
			const shouldChangeFillColor = checkMatchingConditionalFill(format);
			if (shouldChangeFillColor) fillColor = format.color;
		}

		return fillColor;

		function checkMatchingConditionalFill(format: (typeof props)['conditionalFill'][number]): boolean {
			let value: string | number;
			let compareValue: string | number;

			if (format.axis === 'X') {
				value = x.toString();
				compareValue = format.value;
			} else {
				value = y;
				const formatValue = Number(format.value ?? 0);
				if (isNaN(formatValue)) return false;
				compareValue = formatValue;
			}

			switch (format.operator || '>=') {
				case '=':
					return value === compareValue;
				case '!=':
					return value !== compareValue;
				case '>':
					return Number(value) > compareValue;
				case '>=':
					return Number(value) >= compareValue;
				case '<':
					return Number(value) < compareValue;
				case '<=':
					return Number(value) < compareValue;
				case 'contains':
					return typeof compareValue === 'string' && typeof value === 'string'
						? (compareValue as string).includes(value)
						: false;
				case 'ncontains':
					return typeof compareValue === 'string' && typeof value === 'string'
						? !(compareValue as string).includes(value)
						: false;
				case 'starts_with':
					return typeof compareValue === 'string' && typeof value === 'string'
						? (compareValue as string).startsWith(value)
						: false;
				case 'ends_with':
					return typeof compareValue === 'string' && typeof value === 'string'
						? (compareValue as string).endsWith(value)
						: false;
				default:
					return false;
			}
		}
	}
}
</script>

<style scoped>
.bar-chart {
	padding: 0px;
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
</style>
