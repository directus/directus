<template>
	<div class="metric type-title selectable" :class="{ 'has-header': showHeader }">
		<v-progress-circular v-if="loading" indeterminate />
		<div v-else :style="{ color }">
			<span class="prefix">{{ prefix }}</span>
			<span class="value">{{ displayValue }}</span>
			<span class="suffix">{{ suffix }}</span>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, computed, watchEffect } from 'vue';
import api from '@/api';
import { Filter } from '@directus/shared/types';
import { useI18n } from 'vue-i18n';
import { isNil } from 'lodash';
import { getEndpoint, abbreviateNumber } from '@directus/shared/utils';
import { cssVar } from '@directus/shared/utils/browser';

export default defineComponent({
	props: {
		showHeader: {
			type: Boolean,
			default: false,
		},

		abbreviate: {
			type: Boolean,
			default: false,
		},
		sortField: {
			type: String,
			default: undefined,
		},
		collection: {
			type: String,
			required: true,
		},
		field: {
			type: String,
			required: true,
		},
		function: {
			type: String as PropType<
				'avg' | 'avgDistinct' | 'sum' | 'sumDistinct' | 'count' | 'countDistinct' | 'min' | 'max' | 'first' | 'last'
			>,
			required: true,
		},
		filter: {
			type: Object as PropType<Filter>,
			default: () => ({}),
		},
		decimals: {
			type: Number,
			default: 0,
		},
		conditionalFormatting: {
			type: Array as PropType<
				{
					operator: '=' | '!=' | '>' | '>=' | '<' | '<=';
					color: string;
					value: number;
				}[]
			>,
			default: () => [],
		},
		prefix: {
			type: String,
			default: null,
		},
		suffix: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const { n } = useI18n();

		const metric = ref<number | string>();
		const loading = ref(false);

		watchEffect(async () => {
			const isRawValue = ['first', 'last'].includes(props.function);

			loading.value = true;

			try {
				const sort = props.sortField && `${props.function === 'last' ? '-' : ''}${props.sortField}`;

				const aggregate = isRawValue
					? undefined
					: {
							[props.function]: [props.field || '*'],
					  };

				const res = await api.get(getEndpoint(props.collection), {
					params: {
						aggregate,
						filter: props.filter,
						sort: sort,
						limit: 1,
						fields: [props.field],
					},
				});

				if (props.field) {
					if (props.function === 'first' || props.function === 'last') {
						if (typeof res.data.data[0][props.field] === 'string') {
							metric.value = res.data.data[0][props.field];
						} else {
							metric.value = Number(res.data.data[0][props.field]);
						}
					} else {
						metric.value = Number(res.data.data[0][props.function][props.field]);
					}
				} else {
					metric.value = Number(res.data.data[0][props.function]);
				}
			} catch (err) {
				// oh no
			} finally {
				loading.value = false;
			}
		});

		const displayValue = computed(() => {
			if (isNil(metric.value)) return null;

			if (props.abbreviate) {
				return abbreviateNumber(metric.value, props.decimals ?? 0);
			}

			if (typeof metric.value === 'string') {
				return metric.value;
			}

			return n(Number(metric.value), 'decimal', {
				minimumFractionDigits: props.decimals ?? 0,
				maximumFractionDigits: props.decimals ?? 0,
			} as any);
		});

		const color = computed(() => {
			if (isNil(metric.value)) return null;

			let matchingFormat: MetricOptions['conditionalFormatting'][number] | null = null;

			for (const format of props.conditionalFormatting || []) {
				if (matchesOperator(format)) {
					matchingFormat = format;
				}
			}

			return matchingFormat ? matchingFormat.color || cssVar('--primary') : null;

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
</style>
