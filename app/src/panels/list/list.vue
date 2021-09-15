<template>
	<div class="list type-title selectable" :class="{ 'has-header': showHeader }">
		<v-progress-circular v-if="loading" indeterminate />
		<div v-else :style="{ color }">
			<v-list>
				<v-list-item>
					<v-list-item-content>
						{{ rendertemplate }}
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, PropType, computed } from 'vue';
import api from '@/api';
import { isEqual } from 'lodash';
import { Filter } from '@directus/shared/types';
import { useI18n } from 'vue-i18n';
import { abbreviateNumber } from '@/utils/abbreviate-number';
import { isNil } from 'lodash';

type ListOptions = {
	abbreviate: boolean;
	sortField: string;
	sortDirection: string;
	collection: string;
	field: string;
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
			type: Object as PropType<ListOptions>,
			default: null,
		},
		showHeader: {
			type: Boolean,
			default: false,
		},
	},
	setup(props) {
		const { n } = useI18n();

		const list = ref();
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
			if (isNil(list.value)) return null;

			if (props.options.abbreviate) {
				return abbreviateNumber(list.value, props.options.decimals ?? 0);
			}

			return n(Number(list.value), 'decimal', {
				minimumFractionDigits: props.options.decimals ?? 0,
				maximumFractionDigits: props.options.decimals ?? 0,
			} as any);
		});

		const color = computed(() => {
			if (isNil(list.value)) return null;

			let matchingFormat: ListOptions['conditionalFormatting'][number] | null = null;

			for (const format of props.options.conditionalFormatting || []) {
				if (matchesOperator(format)) {
					matchingFormat = format;
				}
			}

			return matchingFormat ? matchingFormat.color || '#00C897' : null;

			function matchesOperator(format: ListOptions['conditionalFormatting'][number]) {
				const value = Number(list.value);
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

		return { list, loading, displayValue, color };

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
						list.value = Number(res.data.data[0][props.options.field]);
					} else {
						list.value = Number(res.data.data[0][props.options.function][props.options.field]);
					}
				} else {
					list.value = Number(res.data.data[0][props.options.function]);
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
.list {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	font-weight: 800;
	font-size: 42px;
	line-height: 52px;
}

.list.has-header {
	height: calc(100% - 16px);
}
</style>
