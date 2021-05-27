<template>
	<div class="time-series" ref="chartEl" />
</template>

<script lang="ts">
import { defineComponent, PropType, ref, watch, onMounted } from '@vue/composition-api';
import api from '@/api';
import { Chart } from 'frappe-charts/src/js/charts/AxisChart';

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
		const chart = ref();

		watch(props.options, fetchData);

		fetchData();

		onMounted(() => {
			chart.value = new Chart(chartEl.value, {
				data: getChartData(),
				type: 'line',
				height: props.height * 20,
				axisOptions: {
					xIsSeries: true,
					xAxisMode: 'tick',
				},
				lineOptions: {
					regionFill: true,
					spline: true,
					hideDots: true,
				},
			});
		});

		return { chartEl, metrics, loading, error };

		async function fetchData() {
			loading.value = true;

			try {
				const results = await api.get(`/items/${props.options.collection}`, {
					params: {
						limit: props.options.limit,
						group: props.options.dateField,
						aggregate: {
							[props.options.function]: {
								[props.options.valueField]: 'value',
							},
						},
					},
				});

				metrics.value = results.data.data;
				chart.value?.update(getChartData());
			} catch (err) {
				error.value = err;
			} finally {
				loading.value = false;
			}
		}

		function getChartData() {
			return {
				labels: metrics.value.map((metric) => metric[props.options.dateField]),
				datasets: [
					{ name: props.options.collection, values: metrics.value.map((metric) => Number(metric.value).toFixed(2)) },
				],
			};
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
