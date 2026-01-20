<script setup lang="ts">
import type { Filter } from '@directus/types';
import ApexCharts from 'apexcharts';
import { isNil, snakeCase } from 'lodash';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFieldsStore } from '@/stores/fields';
import { PanelFunction, StringConditionalFillOperators } from '@/types/panels';

type ConditionalFillFormat = {
	axis: 'X' | 'Y';
	operator: StringConditionalFillOperators;
	color: string;
	value: number;
};

const props = withDefaults(
	defineProps<{
		showHeader?: boolean;
		height: number;
		data?: Record<string, any>[] | [Record<string, any>[], Record<string, any>[]];
		collection: string;
		horizontal?: boolean;
		xAxis: string;
		function?: PanelFunction;
		yAxis: string;
		xAxisDisplayField?: string;
		decimals?: number;
		color?: string | null;
		filter?: Filter;
		showAxisLabels?: string;
		showDataLabel?: boolean;
		conditionalFill?: ConditionalFillFormat[] | null;
	}>(),
	{
		showHeader: false,
		data: () => [],
		horizontal: false,
		decimals: 2,
		color: 'var(--theme--primary)',
		function: 'max',
		filter: () => ({}),
		showAxisLabels: 'both',
		showDataLabel: true,
		conditionalFill: () => [],
	},
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
		() => props.xAxisDisplayField,
	],
	() => {
		chart.value?.destroy();
		setUpChart();
	},
	{ deep: true },
);

onMounted(setUpChart);

onUnmounted(() => {
	chart.value?.destroy();
});

const formatNumericValue = (val: any) => {
	if (typeof val === 'number') return n(val);
	return val;
};

const isTwoQueryResult = computed(() => {
	return (
		Array.isArray(props.data) && props.data.length === 2 && Array.isArray(props.data[0]) && Array.isArray(props.data[1])
	);
});

const aggregatedData = computed(() => {
	if (isTwoQueryResult.value) {
		return (props.data as [Record<string, any>[], Record<string, any>[]])[0];
	}

	return props.data as Record<string, any>[];
});

const displayValueMap = computed(() => {
	if (!isTwoQueryResult.value || !props.xAxisDisplayField) return null;

	const displayData = (props.data as [Record<string, any>[], Record<string, any>[]])[1];
	const map = new Map<string, string>();

	if (!displayData || displayData.length === 0) return null;

	// Infer the primary key field - it's the field that isn't the display field
	const firstItem = displayData[0];
	const fields = Object.keys(firstItem ?? {});
	const pkField = fields.find((f) => f !== props.xAxisDisplayField);
	if (!pkField) return null;

	for (const item of displayData) {
		const pk = item[pkField];
		const displayValue = item[props.xAxisDisplayField];

		if (pk !== null && pk !== undefined && displayValue !== null && displayValue !== undefined) {
			map.set(String(pk), String(displayValue));
		}
	}

	return map;
});

const getDisplayValue = (rawValue: any) => {
	if (!displayValueMap.value || rawValue === null || rawValue === undefined) {
		return rawValue;
	}

	return displayValueMap.value.get(String(rawValue)) ?? rawValue;
};

function setUpChart() {
	const metrics = aggregatedData.value
		.map((metric) => {
			const rawX = metric['group']?.[props.xAxis];
			if (!rawX) return null;

			// Use display value if available, otherwise fall back to raw value
			const x = getDisplayValue(rawX);

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
			fontFamily: 'var(--theme--fonts--sans--font-family)',
			foreColor: 'var(--theme--foreground-subdued)',
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
			borderColor: 'var(--theme--border-color-subdued)',
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
				color: 'var(--theme--border-color-subdued)',
			},
			axisTicks: {
				show: false,
			},
			labels: {
				show: ['both', 'xOnly'].includes(props.showAxisLabels),
				rotate: 0,
				showDuplicates: true,
				style: {
					fontFamily: 'var(--theme--fonts--sans--font-family)',
					foreColor: 'var(--theme--foreground-subdued)',
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
				color: 'var(--theme--border-color-subdued)',
			},
			axisTicks: {
				show: false,
			},
			labels: {
				show: ['both', 'yOnly'].includes(props.showAxisLabels),
				formatter: formatNumericValue,
				style: {
					fontFamily: 'var(--theme--fonts--sans--font-family)',
					foreColor: 'var(--theme--foreground-subdued)',
					fontWeight: 600,
					fontSize: '10px',
				},
			},
		},
	});

	chart.value.render();

	function getFillColor(x: string | number, y: string | number) {
		let fillColor = props.color || 'var(--theme--primary)';
		if (isNil(x) || isNil(y) || !props.conditionalFill?.length) return fillColor;

		for (const format of props.conditionalFill) {
			const shouldChangeFillColor = checkMatchingConditionalFill(format);
			if (shouldChangeFillColor) fillColor = format.color;
		}

		return fillColor;

		function checkMatchingConditionalFill(format: ConditionalFillFormat): boolean {
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
				case 'nstarts_with':
					return typeof compareValue === 'string' && typeof value === 'string'
						? !(compareValue as string).startsWith(value)
						: false;
				case 'istarts_with':
					return typeof compareValue === 'string' && typeof value === 'string'
						? (compareValue as string).toLocaleLowerCase().startsWith(value.toLocaleLowerCase())
						: false;
				case 'nistarts_with':
					return typeof compareValue === 'string' && typeof value === 'string'
						? !(compareValue as string).toLocaleLowerCase().startsWith(value.toLocaleLowerCase())
						: false;
				case 'ends_with':
					return typeof compareValue === 'string' && typeof value === 'string'
						? (compareValue as string).endsWith(value)
						: false;
				case 'nends_with':
					return typeof compareValue === 'string' && typeof value === 'string'
						? !(compareValue as string).endsWith(value)
						: false;
				case 'iends_with':
					return typeof compareValue === 'string' && typeof value === 'string'
						? (compareValue as string).toLocaleLowerCase().endsWith(value.toLocaleLowerCase())
						: false;
				case 'niends_with':
					return typeof compareValue === 'string' && typeof value === 'string'
						? !(compareValue as string).toLocaleLowerCase().endsWith(value.toLocaleLowerCase())
						: false;
				default:
					return false;
			}
		}
	}
}
</script>

<template>
	<div class="bar-chart">
		<div ref="chartEl" />
	</div>
</template>

<style scoped>
.bar-chart {
	padding: 0;
	block-size: 100%;
	inline-size: 100%;
}
</style>

<style>
.apexcharts-tooltip.apexcharts-theme-light {
	border-color: var(--theme--form--field--input--border-color) !important;
}

.apexcharts-tooltip.apexcharts-theme-light .apexcharts-tooltip-title {
	border-color: var(--theme--form--field--input--border-color) !important;
	margin-block-end: 0;
	padding: 0 4px;
	font-weight: 600 !important;
	font-size: 10px !important;
	background-color: var(--theme--background-subdued) !important;
}

.apexcharts-tooltip-series-group {
	background-color: var(--theme--background-accent) !important;
	padding: 0;
}

.apexcharts-tooltip-series-group .apexcharts-active {
	padding: 0 4px 0 0 !important;
}

.apexcharts-tooltip-series-group:last-child {
	padding-block: 0;
}

.apexcharts-tooltip-text {
	line-height: 1.5 !important;
	color: var(--theme--foreground);
}
</style>
