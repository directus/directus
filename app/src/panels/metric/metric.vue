<template>
	<div class="metric type-title">{{ loading ? 'loading' : metric }}</div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from '@vue/composition-api';
import api from '@/api';

export default defineComponent({
	props: {
		options: {
			type: Object,
			default: null,
		},
	},
	setup(props) {
		const metric = ref();
		const loading = ref(false);

		fetchData();

		watch(props.options, fetchData);

		return { metric, loading };

		async function fetchData() {
			if (!props.options) return;

			loading.value = true;

			try {
				const res = await api.get(`/items/${props.options.all.collection}`, {
					params: {
						aggregate: {
							[props.options.all.function]: {
								[props.options.all.field]: 'result',
							},
						},
						filter: props.options.all.filter,
					},
				});

				metric.value = Number(res.data.data[0].result).toFixed(props.options.all.decimals || 2);
			} catch (err) {
				// oh no
			} finally {
				loading.value = false;
			}
		}
	},
});
</script>

<style scoped>
.metric {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: calc(100% - 24px);
}
</style>
