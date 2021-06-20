<template>
	<div class="metric type-title selectable" :class="{ 'has-header': show_header }">
		<v-progress-circular indeterminate v-if="loading" />
		<template v-else>
			<span class="prefix">{{ options.prefix }}</span>
			<span class="value" :style="{ color }">{{ displayValue }}</span>
			<span class="suffix">{{ options.suffix }}</span>
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType, computed } from 'vue';
import api from '@/api';
import { isEqual } from 'lodash';
import { Filter } from '@/types';
import { useI18n } from 'vue-i18n';
import { abbreviateNumber } from '@/utils/abbreviate-number';

type MetricOptions = {
	abbreviate: boolean;
	sortField: string;
	sortDirection: string;
	collection: string;
	field: string;
	function:
		| 'avg'
		| 'avg_distinct'
		| 'sum'
		| 'sum_distinct'
		| 'count'
		| 'count_distinct'
		| 'min'
		| 'max'
		| 'first'
		| 'last';
	filter: Filter;
	decimals: number;
	conditionalFormatting: {
		operator: '=' | '!=' | '>' | '>=' | '<' | '<=';
		color: string;
		value: number;
	}[];
};

export default defineComponent({
	props: {
		options: {
			type: Object as PropType<MetricOptions>,
			default: null,
		},
		show_header: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const { n } = useI18n();

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

		const displayValue = computed(() => {
			if (!metric.value) return null;

			if (props.options.abbreviate) {
				return abbreviateNumber(metric.value, props.options.decimals);
			}

			return n(Number(metric.value), 'decimal', {
				minimumFractionDigits: props.options.decimals,
				maximumFractionDigits: props.options.decimals,
			} as any);
		});

		const color = computed(() => {
			if (!metric.value) return null;

			let matchingFormat: MetricOptions['conditionalFormatting'][number] | null = null;

			for (const format of props.options.conditionalFormatting || []) {
				if (matchesOperator(format)) {
					matchingFormat = format;
				}
			}

			return matchingFormat ? matchingFormat.color || '#00C897' : null;

			function matchesOperator(format: MetricOptions['conditionalFormatting'][number]) {
				const value = Number(metric.value);
				const compareValue = Number(format.value ?? 0);

				switch (format.operator || '>=') {
					case '=':
						return value === compareValue;
					case '!=':
						return value !== compareValue;
					case '>':
						return value > compareValue;
					case '>=':
						return value >= compareValue;
					case '<':
						return value < compareValue;
					case '<=':
						return value < compareValue;
				}
			}
		});

		return { metric, loading, displayValue, color };

		async function fetchData() {
			if (!props.options) return;

			const isRawValue = ['first', 'last'].includes(props.options.function);

			loading.value = true;

			try {
				const sort =
					props.options.sortField && `${props.options.function === 'last' ? '-' : ''}${props.options.sortField}`;

				const aggregate = isRawValue
					? undefined
					: {
							[props.options.function]: [props.options.field || '*'],
					  };

				const res = await api.get(`/items/${props.options.collection}`, {
					params: {
						aggregate,
						filter: props.options.filter,
						sort: sort,
						limit: 1,
						fields: [props.options.field],
					},
				});

				if (props.options.field) {
					if (props.options.function === 'first' || props.options.function === 'last') {
						metric.value = Number(res.data.data[0][props.options.field]);
					} else {
						metric.value = Number(res.data.data[0][`${props.options.field}_${props.options.function}`]);
					}
				} else {
					metric.value = Number(res.data.data[0][props.options.function]);
				}
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
	height: calc(100% - 16px);
}

.suffix {
	position: relative;
	top: 7px;
	font-weight: 700;
	font-size: 24px;
}
</style>
