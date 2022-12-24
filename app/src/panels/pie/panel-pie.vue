<template>
	<div class="pie">
		<div ref="chartEl" />
	</div>
</template>

<script setup lang="ts">
import Color from 'color';
import { useFieldsStore } from '@/stores/fields';
import { Filter } from '@directus/shared/types';
import { cssVar } from '@directus/shared/utils/browser';
import ApexCharts from 'apexcharts';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

const props = withDefaults(
	defineProps<{
		height: number;
		showHeader?: boolean;
		data?: object[];
		id: string;
		collection: string;
		groupField: string;
		aggregationField: string;
		function: string;
		filter?: Filter;
		showPercentage?: boolean;
		color?: string;
		shadeIntensity?: number;
	}>(),
	{
		showHeader: false,
		data: () => [],
		filter: () => ({}),
		showPercentage: false,
		color: () => cssVar('--primary'),
		shadeIntensity: 0.35,
	}
);

const fieldsStore = useFieldsStore();

const chartEl = ref();
const chart = ref<ApexCharts>();

const value2Label = computed(() => {
	const v2l: Record<string, string> = {};
	const field = fieldsStore.getField(props.collection, props.groupField)!;
	(field.meta?.options?.choices || []).forEach((c) => {
		v2l[c.value] = c.text;
	});
	return v2l;
});

const labelTexts = computed(() => {
	return props.data.map((d) => value2Label.value[d.group[props.groupField]] || String(d.group[props.groupField]));
});

const colors = computed(() => {
	return labelTexts.value.map((l, i) => {
		let c = Color(props.color);
		c = c.lighten((props.shadeIntensity * i * (100 - c.lightness())) / c.lightness());
		return c.hex();
	});
});

const labelColors = computed(() => {
	return colors.value.map((c) => {
		const color = Color(c);
		return color.isLight() ? '#000' : '#fff';
	});
});

watch(
	[() => props.data, () => props.showPercentage, () => props.color, () => props.shadeIntensity],
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
	const dataLabels = props.showPercentage
		? {}
		: {
				formatter: function (val, opts) {
					return opts.w.config.series[opts.seriesIndex];
				},
		  };
	chart.value = new ApexCharts(chartEl.value, {
		series: props.data.map((d) => d[props.function][props.aggregationField] ?? 0),
		labels: labelTexts.value,
		colors: colors.value,
		chart: {
			width: '100%',
			height: '100%',
			type: 'pie',
			fontFamily: 'var(--family-sans-serif)',
			foreColor: 'var(--foreground-subdued)',
		},
		legend: {
			position: 'bottom',
			fontFamily: 'var(--family-sans-serif)',
			fontWeight: 600,
		},
		tooltip: {
			theme: 'light',
			style: {
				fontFamily: 'var(--family-sans-serif)',
			},
		},
		dataLabels: {
			...dataLabels,
			style: {
				colors: labelColors.value,
			},
			dropShadow: {
				enabled: false,
			},
		},
	});

	chart.value.render();
}
</script>

<style scoped>
.pie {
	width: 100%;
	height: 100%;
}
</style>
