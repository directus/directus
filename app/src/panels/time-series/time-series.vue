<template>
	<div class="time-series" ref="chartEl" />
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch, onMounted, onUnmounted } from 'vue';
import api from '@/api';
import ApexCharts from 'apexcharts';

type TimeSeriesOptions = {
	collection: string;
	dateField: string;
	valueField: string;
	function: 'avg' | 'sum' | 'min' | 'max' | 'count';
	range: string; // 1 week, etc
	color: string;
	decimals: number;
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
		const metrics = ref<Record<string, any>[]>([]);
		const loading = ref(false);
		const error = ref();
		const chartEl = ref();
		const chart = ref<ApexCharts>();

		watch(() => props.options, fetchData, { deep: true });

		fetchData();

		onMounted(() => {
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
				dataLabels: {
					enabled: false,
				},
				tooltip: {
					marker: {
						show: false,
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
				},
			});

			chart.value.render();
		});

		onUnmounted(() => {
			chart.value?.destroy();
		});

		return { chartEl, metrics, loading, error };

		async function fetchData() {
			loading.value = true;

			try {
				const results = await api.get(`/items/${props.options.collection}`, {
					params: {
						group: [
							`year(${props.options.dateField})`,
							`month(${props.options.dateField})`,
							`day(${props.options.dateField})`,
							`hour(${props.options.dateField})`,
						],
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
					},
				});

				metrics.value = results.data.data;

				chart.value?.updateOptions({
					xaxis: {
						categories: metrics.value.map((metric) => {
							const year = metric[`${props.options.dateField}_year`];
							const month = metric[`${props.options.dateField}_month`];
							const day = metric[`${props.options.dateField}_day`];
							const hour = metric[`${props.options.dateField}_hour`];

							return `${year}-${month}-${day}T${hour}:00:00`;
						}),
					},
				});

				chart.value?.updateSeries([
					{
						name: props.options.collection,
						data: metrics.value.map((metric) =>
							Number(
								Number(metric[`${props.options.valueField}_${props.options.function}`]).toFixed(
									props.options.decimals ?? 0
								)
							)
						),
					},
				]);
			} catch (err) {
				error.value = err;
			} finally {
				loading.value = false;
			}
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
