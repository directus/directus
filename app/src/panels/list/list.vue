<template>
	<div class="list type-title selectable" :class="{ 'has-header': showHeader }">
		<v-progress-circular v-if="loading" indeterminate />
		<div v-else :style="{ color }">
			<v-list v-for="row in list" :key="row.id">
				<v-list-item class="item">
					<v-list-item-content>
						<render-template :item="row" :collection="options.collection" :template="renderTemplate" />
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
import { isNil } from 'lodash';

type ListOptions = {
	abbreviate: boolean;
	displayTemplate: string;
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
		const list = ref<Record<string, any>[]>([]);
		const loading = ref(false);
		const error = ref();

		fetchData();

		watch(
			() => props.options,
			(newOptions, oldOptions) => {
				if (isEqual(newOptions, oldOptions)) return;
				fetchData();
			},
			{ deep: true }
		);

		const renderTemplate = computed(() => {
			return props.options.displayTemplate;
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

		return { list, loading, color, renderTemplate };

		async function fetchData() {
			if (!props.options) return;

			loading.value = true;

			try {
				const sort = props.options.sortField;
				const res = await api.get(`/items/${props.options.collection}`, {
					params: {
						filter: props.options.filter,
						sort: sort,
					},
				});
				list.value = res.data.data;
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
.list {
	height: 100%;
	overflow-y: scroll;
}

.list .item {
	padding-left: 30px;
	font-weight: normal;
	font-size: 16px;
	border-top: 1px solid var(--border-subdued);
}

.list.has-header {
	height: calc(100% - 16px);
}
</style>
