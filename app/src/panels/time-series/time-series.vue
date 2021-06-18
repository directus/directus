<template>
	<div class="time-series" ref="chartEl" />
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch, onMounted, onUnmounted, computed } from 'vue';
import api from '@/api';
import ApexCharts from 'apexcharts';
import { adjustDate } from '@/utils/adjust-date';
import { useI18n } from 'vue-i18n';
import { isEqual } from 'lodash';
import { useFieldsStore } from '@/stores';

type TimeSeriesOptions = {
	collection: string;
	dateField: string;
	valueField: string;
	function: 'avg' | 'avg_distinct' | 'sum' | 'sum_distinct' | 'count' | 'count_distinct' | 'min' | 'max';
	range: string; // 1 week, etc
	color: string;
	decimals: number;
	precision: 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';
	showZero: boolean;
};

export default defineComponent({
	props: {
		options: {
			type: Object as PropType<TimeSeriesOptions>,
			required: true,
		},
		height: {
			type: Number,
			required: true,
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
			const field = fieldsStore.getField(props.options.collection, props.options.valueField);
			const operation = t(props.options.function);
			return `${field.name} (${operation})`;
		});

		watch(
			() => props.options,
			(newOptions, oldOptions) => {
				if (isEqual(newOptions, oldOptions) === false) {
					fetchData();
					chart.value?.destroy();
					setupChart();
				}
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
				const results = await api.get(`/items/${props.options.collection}`, {
					params: {
						group: getGroups(),
						aggregate: {
							[props.options.function]: [props.options.valueField],
						},
						filter: {
							_and: [
								{
									[props.options.dateField]: {
										_gte: `$NOW(-${props.options.range || '1 week'})`,
									},
								},
								{
									[props.options.dateField]: {
										_lte: `$NOW`,
									},
								},
							],
						},
						limit: -1,
					},
				});

				metrics.value = results.data.data;

				chart.value?.updateSeries([
					{
						name: props.options.collection,
						data: metrics.value.map((metric) => ({
							x: toISO(metric),
							y: Number(
								Number(metric[`${props.options.valueField}_${props.options.function}`]).toFixed(
									props.options.decimals ?? 0
								)
							),
						})),
					},
				]);
			} catch (err) {
				error.value = err;
			} finally {
				loading.value = false;
			}

			function toISO(metric: Record<string, any>) {
				const year = metric[`${props.options.dateField}_year`];
				const month = padZero(metric[`${props.options.dateField}_month`] ?? 1);
				const day = padZero(metric[`${props.options.dateField}_day`] ?? 1);
				const hour = padZero(metric[`${props.options.dateField}_hour`] ?? 0);
				const minute = padZero(metric[`${props.options.dateField}_minute`] ?? 0);
				const second = padZero(metric[`${props.options.dateField}_second`] ?? 0);

				return `${year}-${month}-${day}T${hour}:${minute}:${second}`;

				function padZero(value: number) {
					return String(value).padStart(2, '0');
				}
			}

			function getGroups() {
				let groups: string[] = [];

				switch (props.options.precision || 'hour') {
					case 'year':
						groups = ['year'];
						break;
					case 'month':
						groups = ['year', 'month'];
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

				return groups.map((datePart) => `${datePart}(${props.options.dateField})`);
			}
		}

		function setupChart() {
			chart.value = new ApexCharts(chartEl.value, {
				colors: [props.options.color ? props.options.color : 'var(--primary)'],
				chart: {
					type: 'area',
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
					curve: 'smooth',
					width: 2,
					lineCap: 'round',
				},
				fill: {
					type: 'gradient',
					gradient: {
						colorStops: [
							[
								{
									offset: 0,
									color: props.options.color ? props.options.color : 'var(--primary)',
									opacity: 0.25,
								},
								{
									offset: 100,
									color: props.options.color ? props.options.color : 'var(--primary)',
									opacity: 0,
								},
							],
						],
					},
				},
				grid: {
					padding: {
						top: -20,
						bottom: 8,
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
					range: new Date().getTime() - adjustDate(new Date(), `-${props.options.range}`)!.getTime(),
					max: new Date().getTime(),
				},
				yaxis: {
					forceNiceScale: true,
					min: props.options.showZero ? 0 : undefined,
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
