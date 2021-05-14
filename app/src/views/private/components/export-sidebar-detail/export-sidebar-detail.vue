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
import { defineComponent, ref, PropType } from '@vue/composition-api';
import { Collection, Filter } from '@/types';
import api from '@/api';
import { getRootPath } from '@/utils/get-root-path';
import filtersToQuery from '@/utils/filters-to-query';

export default defineComponent({
	props: {
		filters: {
			type: Array as PropType<Filter[]>,
			default: () => [],
		},
		layoutQuery: {
			type: Object,
			default: () => ({}),
		},
		searchQuery: {
			type: String,
			default: null,
		},
		collection: {
			type: Object as PropType<Collection>,
			required: true,
		},
	},
	setup(props) {
		const format = ref('csv');
		const useFilters = ref(true);

		return { format, useFilters, exportData };

		function exportData() {
			const url = getRootPath() + `items/${props.collection.collection}`;

			let params: Record<string, any> = {
				access_token: api.defaults.headers.Authorization.substring(7),
			};

			if (format.value === 'csv') {
				params.export = 'csv';
			} else if (format.value === 'xml') {
				params.export = 'xml';
			} else {
				params.export = 'json';
			}

			if (useFilters.value === true) {
				params = {
					...params,
					...props.layoutQuery,
				};

				if (props.filters?.length) {
					params = {
						...params,
						...filtersToQuery(props.filters),
					};
				}

				if (props.searchQuery) {
					params.search = props.searchQuery;
				}
			}

			const exportUrl = api.getUri({
				url,
				params,
			});

			window.open(exportUrl);
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
