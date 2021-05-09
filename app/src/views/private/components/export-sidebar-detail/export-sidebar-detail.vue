<template>
	<sidebar-detail icon="save_alt" :title="$t('export_data')">
		<div class="fields">
			<div class="field full">
				<p class="type-label">{{ $t('format') }}</p>
				<v-select
					:items="[
						{
							text: $t('csv'),
							value: 'csv',
						},
						{
							text: $t('json'),
							value: 'json',
						},
						{
							text: $t('xml'),
							value: 'xml',
						},
					]"
					v-model="format"
				/>
				<v-checkbox v-model="useFilters" :label="$t('use_current_filters_settings')" />
			</div>

			<div class="field full">
				<v-button full-width @click="exportData">
					{{ $t('export_collection', { collection: collection.name }) }}
				</v-button>
			</div>
		</div>
	</sidebar-detail>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, toRefs, PropType } from '@vue/composition-api';
import { Field, Filter } from '@/types';
import filtersToQuery from '@/utils/filters-to-query';
import useSync from '@/composables/use-sync';
import api from '@/api';
import { getRootPath } from '@/utils/get-root-path';

type layoutQuery = {
	fields?: string[];
	sort?: string;
};

export default defineComponent({
	props: {
		fields: {
			type: Array as PropType<Field[]>,
			default: () => [],
		},
		layoutQuery: {
			type: Object as PropType<layoutQuery>,
			default: () => ({}),
		},
		filters: {
			type: Array as PropType<Filter[]>,
			default: () => [],
		},
		searchQuery: {
			type: String as PropType<string | null>,
			default: null,
		},
		collection: {
			type: String,
			required: true,
		},
	},
	setup(props, { emit }) {
		const format = ref('csv');
		const useFilters = ref(true);

		const { fields, searchQuery, filters } = toRefs(props);
		const layoutQuery: Ref<any> = useSync(props, 'layoutQuery', emit);

		return { format, useFilters, exportData };

		function exportData() {
			const url = getRootPath() + `items/${props.collection}`;

			let params: Record<string, any> = {
				access_token: api.defaults.headers.Authorization.substring(7),
			};

			if (format.value === 'csv' || format.value === 'xml' || format.value === 'json') params.export = format.value;
			else params.export = 'json';

			if (useFilters.value === true) {
				if (layoutQuery.value && layoutQuery.value.sort) params.sort = layoutQuery.value.sort;
				if (fields.value) params.fields = [...fields.value];
				if (searchQuery.value) params.search = searchQuery.value;

				if (filters.value) {
					let parsed_filter = filtersToQuery(filters.value);
					var filter = [] as any;

					Object.keys(parsed_filter).forEach(function (item) {
						filter.push(JSON.stringify(parsed_filter[item]));
					});

					params.filter = encodeURI(filter);
				}
			}

			const qs = Object.keys(params)
				.map((key) => `${key}=${params[key]}`)
				.join('&');

			window.open(`${url}?${qs}`);
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.fields {
	--form-vertical-gap: 24px;

	@include form-grid;

	.type-label {
		font-size: 1rem;
	}
}

.v-checkbox {
	width: 100%;
	margin-top: 8px;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}
</style>
