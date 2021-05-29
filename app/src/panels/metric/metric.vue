<template>
	<div class="metric type-title selectable" :class="{ 'has-header': show_header }">
		<v-progress-circular indeterminate v-if="loading" />
		<template v-else>
			<span class="prefix">{{ options.prefix }}</span>
			<span class="value">{{ metric }}</span>
			<span class="suffix">{{ options.suffix }}</span>
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from '@vue/composition-api';
import api from '@/api';
import { isEqual } from 'lodash';

export default defineComponent({
	props: {
		options: {
			type: Object,
			default: null,
		},
		show_header: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const metric = ref();
		const loading = ref(false);

		fetchData();

		watch(
			() => props.options,
			(newOptions, oldOptions) => {
				if (isEqual(newOptions, oldOptions)) return;
				fetchData();
			},
			{ deep: true }
		);

		return { metric, loading };

		async function fetchData() {
			if (!props.options) return;

			loading.value = true;

			try {
				const sort =
					props.options.sortField && `${props.options.sortDirection === 'desc' ? '-' : ''}${props.options.sortField}`;
				const res = await api.get(`/items/${props.options.collection}`, {
					params: {
						aggregate: {
							[props.options.function]: {
								[props.options.field]: 'result',
							},
						},
						filter: props.options.filter,
						sort: sort,
					},
				});

				metric.value = Number(res.data.data[0].result).toFixed(props.options.decimals ?? 2);
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
	height: 100%;
	font-weight: 800;
	font-size: 42px;
	line-height: 52px;
}

.metric.has-header {
	height: calc(100% - 24px);
}

.suffix {
	position: relative;
	top: 7px;
	font-weight: 700;
	font-size: 24px;
}
</style>
