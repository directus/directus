<script setup lang="ts">
import { useFieldsStore } from '@/stores/fields';
import { PanelFunction } from '@/types/panels';
import type { Filter } from '@directus/types';
import { abbreviateNumber } from '@directus/utils';
import { cssVar } from '@directus/utils/browser';
import ApexCharts from 'apexcharts';
import { isNil } from 'lodash';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { monoThemeGenerator } from '../pie-chart/color-generator';

const props = withDefaults(
	defineProps<{
		showHeader?: boolean;
		height: number;
		collection: string;
		data?: Record<string, any>[];
		aggregation?: string;
		grouping?: string;
		xAxis?: string;
		function: PanelFunction;
		yAxis: string;
		color?: string;
		filter?: Filter;
		decimals?: number;
		showAxisLabels?: string;
		showLegend?: boolean;
		showMarker?: boolean;
		curveType?: string;
		fillType?: string;
		width: number;
		min?: number;
		max?: number;
	}>(),
	{
		showHeader: false,
		data: () => [],
		showAxisLabels: 'both',
		showLegend: false,
		showMarker: true,
		curveType: 'smooth',
		decimals: 2,
		color: 'var(--theme--primary)',
		fillType: 'gradient',
	}
);

const { t, n } = useI18n();

const fieldsStore = useFieldsStore();

const chartEl = ref();
const chart = ref<ApexCharts>();

onMounted(setUpChart);

watch(
	[
		() => props.data,
		() => props.color,
		() => props.fillType,
		() => props.curveType,
		() => props.decimals,
		() => props.min,
		() => props.max,
		() => props.width,
		() => props.height,
		() => props.showAxisLabels,
		() => props.showLegend,
		() => props.showMarker,
		() => props.min,
		() => props.max,
	],
	() => {
		chart.value?.destroy();
		setUpChart();
	},
	{ deep: true }
);

onUnmounted(() => {
	chart.value?.destroy();
});

const yAxisRange = computed(() => {
	let min = isNil(props.min) ? undefined : Number(props.min);
	let max = isNil(props.max) ? undefined : Number(props.max);

	if (max !== undefined && !min) {
		min = 0;
	}

	if (max !== undefined && min !== undefined && max < min) {
		max = min;
		min = Number(props.max);
	}

	return { max, min };
});

function setUpChart() {
	if (props.aggregation && !props.xAxis) return;

	const categories = [...new Set(props.data.map((d) => d['group'][props.xAxis!]))]; // get the unique categories

	let series: any = [];

	if (props.grouping) {
		const seriesDifferentiators = [...new Set(props.data.map((d) => d['group'][props.grouping!]))]; // get the unique category differentiators

		series = seriesDifferentiators.map((differentiator: string) => {
			const seriesData = props.data.filter((item) => item['group'][props.grouping!] == differentiator);

			return {
				name: differentiator,
				data: seriesData.map((item) => item[props.aggregation!][props.yAxis!]),
			};
		});
	} else {
		series = [
			{
				name: props.yAxis,
				data: props.data.map((item) => item[props.aggregation!][props.yAxis!]),
			},
		];
	}

	// Generate monochrome color scheme
	const colors = monoThemeGenerator(
		props.color && props.color.startsWith('var(--')
			? cssVar(props.color.substring(4, props.color.length - 1))
			: props.color ?? 'var(--theme--primary)',
		series.length
	);

	const isSparkline = props.width < 12 || props.height < 10;

	chart.value = new ApexCharts(chartEl.value, {
		colors: colors,
		chart: {
			type: props.fillType === 'disabled' ? 'line' : 'area',
			animation: {
				enabled: false,
			},
			height: '100%',
			width: '100%',
			dropShadow: {
				enabled: false,
			},
			toolbar: {
				show: false,
			},
			selection: {
				enabled: false,
			},
			zoom: {
				enabled: false,
			},
			fontFamily: 'var(--theme--font-family-sans-serif)',
			foreColor: 'var(--theme--foreground-subdued)',
			sparkline: {
				enabled: isSparkline,
			},
		},
		series: series,
		stroke: {
			curve: props.curveType,
			width: 2,
			lineCap: 'round',
		},

		tooltip: {
			theme: 'light',
			marker: {
				show: props.showMarker,
			},
			x: {
				formatter: (index: number) => {
					if (!index) return;
					return `${categories[index - 1]}:`;
				},
			},
			y: {
				title: {
					formatter: (columnName: string | number) => {
						if (!columnName) return;

						const field = fieldsStore.getField(props.collection, String(columnName));
						if (field) return field.name;

						if (isNaN(Number(columnName))) return `${t(columnName)}:`;
						return `${n(Number(columnName))}:`;
					},
				},
				formatter(value: number) {
					if (!value) return;

					return n(value);
				},
			},
		},
		dataLabels: {
			enabled: false,
		},
		grid: {
			borderColor: 'var(--border-subdued)',
			padding: {
				top: isSparkline ? (props.showHeader && 0) || 5 : (props.showHeader && -20) || -2,
				bottom: isSparkline ? 5 : 0,
				left: isSparkline ? 0 : 12,
				right: isSparkline ? 0 : 12,
			},
		},
		markers: {
			colors: colors,
			strokeColors: colors,
		},
		fill: {
			type: props.fillType === 'disabled' ? 'solid' : props.fillType,
			gradient: {
				colorStops: colors.map((color) => {
					return [
						{
							offset: 0,
							color: color,
							opacity: 0.25,
						},
						{
							offset: 100,
							color: color,
							opacity: 0,
						},
					];
				}),
			},
		},
		xaxis: {
			categories,
			type: 'category',
			toolbar: false,
			tooltip: {
				enabled: false,
			},
			axisTicks: {
				show: false,
			},
			axisBorder: {
				show: false,
			},
			labels: {
				show: ['both', 'xAxis'].includes(props.showAxisLabels),
				offsetY: -4,
				style: {
					fontFamily: 'var(--theme--font-family-sans-serif)',
					foreColor: 'var(--theme--foreground-subdued)',
					fontWeight: 600,
					fontSize: '10px',
				},
			},
			crosshairs: {
				stroke: {
					color: 'var(--border-normal)',
				},
			},
		},
		yaxis: {
			show: ['both', 'yAxis'].includes(props.showAxisLabels),
			forceNiceScale: true,
			tickAmount: props.height - 4,
			axisBorder: {
				show: false,
			},
			axisTicks: {
				show: false,
			},
			min: yAxisRange.value.min,
			max: yAxisRange.value.max,
			labels: {
				show: ['both', 'yAxis'].includes(props.showAxisLabels),
				formatter: (value: number) => {
					return value > 10000
						? abbreviateNumber(value, 1)
						: n(value, 'decimal', {
								minimumFractionDigits: 0,
								maximumFractionDigits: props.decimals,
						  } as any);
				},
				style: {
					fontFamily: 'var(--theme--font-family-sans-serif)',
					foreColor: 'var(--theme--foreground-subdued)',
					fontWeight: 600,
					fontSize: '10px',
				},
			},
		},
		legend: {
			show: props.showLegend && !isSparkline,
			position: 'bottom',
			offsetY: -4,
			markers: {
				width: 8,
				height: 8,
			},
			fontFamily: 'var(--theme--font-family-sans-serif)',
			foreColor: 'var(--theme--foreground)',
			fontWeight: 600,
			fontSize: '10px',
		},
	});

	chart.value.render();
}
</script>

<template>
	<div class="line-chart">
		<div ref="chartEl" />
	</div>
</template>

<style scoped>
.line-chart {
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

.apexcharts-tooltip-y-group {
	padding: 0 0 0 0px;
	font-weight: 600 !important;
	font-size: 10px !important;
}

.apexcharts-tooltip-series-group {
	background-color: var(--background-normal-alt) !important;
	padding: 0;
}

.apexcharts-tooltip-series-group.apexcharts-active,
.apexcharts-tooltip-series-group:last-child {
	padding: 0 4px !important;
	padding-bottom: 0px !important;
}

.apexcharts-tooltip-text {
	line-height: 0.5 !important;
	color: var(--theme--foreground);
}

.apexcharts-tooltip-marker {
	height: 8px !important;
	width: 8px !important;
	padding: 4px !important;
}

.apexcharts-yaxistooltip {
	padding: 0 !important;
}
</style>
