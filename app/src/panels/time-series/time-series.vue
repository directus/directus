<template>
	<div ref="chartEl" class="time-series" />
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch, onMounted, onUnmounted, computed } from 'vue';
import api from '@/api';
import ApexCharts from 'apexcharts';
import { adjustDate } from '@/utils/adjust-date';
import { useI18n } from 'vue-i18n';
import { isNil } from 'lodash';
import { useFieldsStore } from '@/stores';
import { Filter } from '@directus/shared/types';
import { getEndpoint, abbreviateNumber } from '@directus/shared/utils';
import { cssVar } from '@directus/shared/utils/browser';
import { addWeeks } from 'date-fns';

export default defineComponent({
	props: {
		height: {
			type: Number,
			required: true,
		},
		showHeader: {
			type: Boolean,
			default: false,
		},
		id: {
			type: String,
			required: true,
		},
		dashboard: {
			type: String,
			required: true,
		},
		now: {
			type: Date,
			required: true,
		},

		collection: {
			type: String,
			required: true,
		},
		dateField: {
			type: String,
			required: true,
		},
		valueField: {
			type: String,
			required: true,
		},
		function: {
			type: String as PropType<
				'avg' | 'avgDistinct' | 'sum' | 'sumDistinct' | 'count' | 'countDistinct' | 'min' | 'max'
			>,
			required: true,
		},
		precision: {
			type: String as PropType<'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second'>,
			default: 'hour',
		},
		range: {
			type: String,
			default: '1 week',
		},
		color: {
			type: String,
			default: cssVar('--primary'),
		},
		fillType: {
			type: String,
			default: 'gradient',
		},
		curveType: {
			type: String,
			default: 'smooth',
		},
		decimals: {
			type: Number,
			default: 0,
		},
		min: {
			type: Number,
			default: undefined,
		},
		max: {
			type: Number,
			default: undefined,
		},
		filter: {
			type: Object as PropType<Filter>,
			default: () => ({}),
		},
		showXAxis: {
			type: Boolean,
			default: true,
		},
		showYAxis: {
			type: Boolean,
			default: true,
		},
	},
	setup(props) {
		const { d, t, n } = useI18n();

		const fieldsStore = useFieldsStore();

		const metrics = ref<Record<string, any>[]>([]);
		const loading = ref(false);
		const error = ref();
		const chartEl = ref();
		const chart = ref<ApexCharts>();

		const valueLabel = computed(() => {
			const field = fieldsStore.getField(props.collection, props.valueField)!;
			const operation = t(props.function);
			return `${field.name} (${operation})`;
		});

		watch(
			[
				() => props.collection,
				() => props.dateField,
				() => props.valueField,
				() => props.function,
				() => props.precision,
				() => props.range,
				() => props.color,
				() => props.fillType,
				() => props.curveType,
				() => props.decimals,
				() => props.min,
				() => props.max,
				() => props.filter,
				() => props.showXAxis,
				() => props.showYAxis,
			],
			() => {
				fetchData();
				chart.value?.destroy();
				setupChart();
			},
			{ deep: true }
		);

		fetchData();

		onMounted(setupChart);

		onUnmounted(() => {
			chart.value?.destroy();
		});

		return { chartEl, metrics, loading, error };

		async function fetchData() {
			loading.value = true;

			try {
				const results = await api.get(getEndpoint(props.collection), {
					params: {
						groupBy: getGroups(),
						aggregate: {
							[props.function]: [props.valueField],
						},
						filter: {
							_and: [
								{
									[props.dateField]: {
										_gte: `$NOW(-${props.range || '1 week'})`,
									},
								},
								{
									[props.dateField]: {
										_lte: `$NOW`,
									},
								},
								props.filter || {},
							],
						},
						limit: -1,
					},
				});

				metrics.value = results.data.data;

				chart.value?.updateSeries([
					{
						name: props.collection,
						data: metrics.value.map((metric) => ({
							x: toISO(metric),
							y: Number(Number(metric[props.function][props.valueField]).toFixed(props.decimals ?? 0)),
						})),
					},
				]);
			} catch (err) {
				error.value = err;
			} finally {
				loading.value = false;
			}

			function toISO(metric: Record<string, any>) {
				const year = metric[`${props.dateField}_year`];
				const month = padZero(metric[`${props.dateField}_month`] ?? 1);
				const week = metric[`${props.dateField}_week`];
				const day = week
					? padZero(getFirstDayOfNWeeksForYear(week, year))
					: padZero(metric[`${props.dateField}_day`] ?? 1);
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

			function getGroups() {
				let groups: string[] = [];

				switch (props.precision || 'hour') {
					case 'year':
						groups = ['year'];
						break;
					case 'month':
						groups = ['year', 'month'];
						break;
					case 'week':
						groups = ['year', 'month', 'week'];
						break;
					case 'day':
						groups = ['year', 'month', 'day'];
						break;
					case 'hour':
						groups = ['year', 'month', 'day', 'hour'];
						break;
					case 'minute':
						groups = ['year', 'month', 'day', 'hour', 'minute'];
						break;
					case 'second':
						groups = ['year', 'month', 'day', 'hour', 'minute', 'second'];
						break;
					default:
						groups = ['year', 'month', 'day', 'hour'];
						break;
				}

				return groups.map((datePart) => `${datePart}(${props.dateField})`);
			}
		}

		function setupChart() {
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
				},
				series: [],
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
					range: props.now.getTime() - adjustDate(props.now, `-${props.range}`)!.getTime(),
					max: props.now.getTime(),
					labels: {
						show: props.showXAxis ?? true,
						offsetY: -4,
						style: {
							fontFamily: 'var(--family-sans-serif)',
							foreColor: 'var(--foreground-subdued)',
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
		}
	},
});
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
