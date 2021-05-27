<template>
	<div class="time-series" ref="chartEl" />
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch, onMounted, onUnmounted } from '@vue/composition-api';
import api from '@/api';
import ApexCharts from 'apexcharts';

type TimeSeriesOptions = {
	collection: string;
	dateField: string;
	valueField: string;
	function: 'avg' | 'sum' | 'min' | 'max' | 'count';
	limit: number;
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
				colors: ['var(--primary)'],
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
				},
				fill: {
					type: 'gradient',
					gradient: {
						colorStops: [
							[
								{
									offset: 0,
									color: 'var(--primary-alt)',
									opacity: 1,
								},
								{
									offset: 100,
									color: 'var(--primary-alt)',
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
						limit: props.options.limit || 100,
						group: props.options.dateField,
						aggregate: {
							[props.options.function]: {
								[props.options.valueField]: props.options.valueField,
							},
						},
					},
				});

				metrics.value = results.data.data;

				chart.value?.updateOptions({
					xaxis: {
						categories: metrics.value.map((metric) => metric[props.options.dateField]),
					},
				});

				chart.value?.updateSeries([
					{
						name: props.options.collection,
						data: metrics.value.map((metric) => metric[props.options.valueField]),
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
