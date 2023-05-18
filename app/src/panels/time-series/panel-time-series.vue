<template>
	<div class="time-series">
		<div ref="chartEl" />
	</div>
</template>

<script setup lang="ts">
import { useFieldsStore } from '@/stores/fields';
import { PanelFunction } from '@/types/panels';
import type { Filter } from '@directus/types';
import { abbreviateNumber, adjustDate } from '@directus/utils';
import { cssVar } from '@directus/utils/browser';
import ApexCharts from 'apexcharts';
import { addWeeks } from 'date-fns';
import { isNil, orderBy, snakeCase } from 'lodash';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
	defineProps<{
		height: number;
		showHeader?: boolean;
		data?: {
			group: Record<string, number | string>;
			count: Record<string, number>;
			countDistinct: Record<string, number>;
			avg: Record<string, number>;
			avgDistinct: Record<string, number>;
			sum: Record<string, number>;
			sumDistinct: Record<string, number>;
			min: Record<string, number>;
			max: Record<string, number>;
		}[];
		id: string;
		now: Date;
		collection: string;
		dateField: string;
		valueField: string;
		function: PanelFunction;
		precision?: string;
		range?: string;
		color?: string;
		fillType?: string;
		curveType?: string;
		decimals?: number;
		min?: number;
		max?: number;
		filter?: Filter;
		showXAxis?: boolean;
		showYAxis?: boolean;
	}>(),
	{
		showHeader: false,
		data: () => [],
		precision: 'hour',
		color: cssVar('--primary'),
		range: '1 week',
		fillType: 'gradient',
		curveType: 'smooth',
		decimals: 0,
		min: undefined,
		max: undefined,
		filter: () => ({}),
		showXAxis: true,
		showYAxis: true,
	}
);

const { d, t, n } = useI18n();

const fieldsStore = useFieldsStore();

const metrics = ref<Record<string, any>[]>([]);
const chartEl = ref();
const chart = ref<ApexCharts>();

const valueLabel = computed(() => {
	const field = fieldsStore.getField(props.collection, props.valueField)!;
	const operation = t(snakeCase(props.function));
	return `${field.name} (${operation})`;
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

watch(
	[
		() => props.data,
		() => props.color,
		() => props.fillType,
		() => props.curveType,
		() => props.decimals,
		() => props.min,
		() => props.max,
		() => props.showXAxis,
		() => props.showYAxis,
	],
	() => {
		chart.value?.destroy();
		setupChart();
	},
	{ deep: true }
);

onMounted(setupChart);

onUnmounted(() => {
	chart.value?.destroy();
});

function setupChart() {
	metrics.value = [];

	const isFieldTimestamp = fieldsStore.getField(props.collection, props.dateField)?.type === 'timestamp';

	const allDates = props.data.map((metric) => {
		return toIncludeTimezoneOffset(metric.group, isFieldTimestamp);
	});

	const minDate = Math.min(...allDates);
	const maxDate = Math.max(...allDates);

	metrics.value = orderBy(
		props.data.map((metric) => ({
			x: toIncludeTimezoneOffset(metric.group, isFieldTimestamp),
			y: Number(Number(metric[props.function][props.valueField]).toFixed(props.decimals ?? 0)),
		})),
		'x'
	);

	chart.value = new ApexCharts(chartEl.value, {
		colors: [props.color ? props.color : cssVar('--primary')],
		chart: {
			type: props.fillType === 'disabled' ? 'line' : 'area',
			height: '100%',
			toolbar: {
				show: false,
			},
			selection: {
				enabled: false,
			},
			zoom: {
				enabled: false,
			},
			fontFamily: 'var(--family-sans-serif)',
			foreColor: 'var(--foreground-subdued)',
			animations: {
				enabled: false,
			},
		},
		series: [
			{
				name: props.collection,
				data: metrics.value,
			},
		],
		stroke: {
			curve: props.curveType,
			width: 2,
			lineCap: 'round',
		},
		markers: {
			hover: {
				size: undefined,
				sizeOffset: 4,
			},
		},
		fill: {
			type: props.fillType === 'disabled' ? 'solid' : props.fillType,
			gradient: {
				colorStops: [
					[
						{
							offset: 0,
							color: props.color ? props.color : cssVar('--primary'),
							opacity: 0.25,
						},
						{
							offset: 100,
							color: props.color ? props.color : cssVar('--primary'),
							opacity: 0,
						},
					],
				],
			},
		},
		grid: {
			borderColor: 'var(--border-subdued)',
			padding: {
				top: props.showHeader ? -20 : -4,
				bottom: 0,
				left: 8,
			},
		},
		dataLabels: {
			enabled: false,
		},
		tooltip: {
			marker: {
				show: false,
			},
			x: {
				show: true,
				formatter(date: number) {
					return d(new Date(date), 'long');
				},
			},
			y: {
				title: {
					formatter: () => valueLabel.value + ': ',
				},
				formatter(value: number) {
					return n(value);
				},
			},
		},
		xaxis: {
			type: 'datetime',
			tooltip: {
				enabled: false,
			},
			axisTicks: {
				show: false,
			},
			axisBorder: {
				show: false,
			},
			range:
				props.range === 'auto'
					? maxDate - minDate
					: props.now.getTime() - adjustDate(props.now, `-${props.range}`)!.getTime(),
			max: props.range === 'auto' ? maxDate : props.now.getTime(),
			labels: {
				show: props.showXAxis ?? true,
				offsetY: -4,
				style: {
					fontFamily: 'var(--family-sans-serif)',
					foreColor: 'var(--foreground-subdued)',
					fontWeight: 600,
					fontSize: '10px',
				},
				datetimeUTC: false,
			},
			crosshairs: {
				stroke: {
					color: 'var(--border-normal)',
				},
			},
		},
		yaxis: {
			show: props.showYAxis ?? true,
			forceNiceScale: true,
			min: isNil(props.min) ? undefined : Number(props.min),
			max: isNil(props.max) ? undefined : Number(props.max),
			tickAmount: props.height - 4,
			labels: {
				offsetY: 1,
				offsetX: -4,
				formatter: (value: number) => {
					return value > 10000
						? abbreviateNumber(value, 1)
						: n(value, 'decimal', {
								minimumFractionDigits: props.decimals ?? 0,
								maximumFractionDigits: props.decimals ?? 0,
						  } as any);
				},
				yaxis: {
					show: props.showYAxis ?? true,
					forceNiceScale: true,
					min: yAxisRange.value.min,
					max: yAxisRange.value.max,
					tickAmount: props.height - 4,
					labels: {
						offsetY: 1,
						offsetX: -4,
						formatter: (value: number) => {
							return value > 10000
								? abbreviateNumber(value, 1)
								: n(value, 'decimal', {
										minimumFractionDigits: props.decimals ?? 0,
										maximumFractionDigits: props.decimals ?? 0,
								  } as any);
						},
						style: {
							fontFamily: 'var(--family-sans-serif)',
							foreColor: 'var(--foreground-subdued)',
							fontWeight: 600,
							fontSize: '10px',
						},
					},
				},
			},
		},
	});

	chart.value.render();

	function toIncludeTimezoneOffset(time: Record<string, any>, isFieldTimestamp: boolean): number {
		return new Date(toISO(time)).getTime() - (isFieldTimestamp ? new Date().getTimezoneOffset() * 60 * 1000 : 0);
	}

	function toISO(metric: Record<string, any>) {
		const year = metric[`${props.dateField}_year`];
		const month = padZero(metric[`${props.dateField}_month`] ?? 1);
		const week = metric[`${props.dateField}_week`];
		const day = week ? padZero(getFirstDayOfNWeeksForYear(week, year)) : padZero(metric[`${props.dateField}_day`] ?? 1);
		const hour = padZero(metric[`${props.dateField}_hour`] ?? 0);
		const minute = padZero(metric[`${props.dateField}_minute`] ?? 0);
		const second = padZero(metric[`${props.dateField}_second`] ?? 0);

		return `${year}-${month}-${day}T${hour}:${minute}:${second}`;

		function padZero(value: number) {
			return String(value).padStart(2, '0');
		}

		function getFirstDayOfNWeeksForYear(numberOfWeeks: number, year: number) {
			return addWeeks(new Date(year, 0, 1), numberOfWeeks).getDate();
		}
	}
}
</script>

<style scoped>
.time-series {
	width: 100%;
	height: 100%;
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
	background-color: var(--background-normal) !important;
	padding: 0;
}

.apexcharts-tooltip-series-group:last-child {
	padding-bottom: 0;
}
</style>
