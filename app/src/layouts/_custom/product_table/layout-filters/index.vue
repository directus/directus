<template>
	<div class="layout-filters">
		<div class="form-grid with-fill">
			<div class="field half-left">
				<filter-field
					:filter="getFilter('status')"
					:field="statusField"
					@input="handleFilters(createStatusFilter($event))"
					@unset="deleteFilter"
				/>
			</div>
			<div class="field half-right">
				<filter-field
					:filter="getFilter('category')"
					:field="categoryField"
					@input="_createCategoryFilter($event)"
					@unset="deleteFilter"
				/>
			</div>
		</div>
		<v-button x-small @click="$emit('update:filters', null)" :disabled="!filters.length > 0">
			{{ $t('clear_filters') }}
		</v-button>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';
import { useFieldsStore } from '@/stores/';
import { Field, Filter } from '@/types';

import FilterField from './filter.vue';
import { createStatusFilter, createCategoryFilter } from './filters';

export default defineComponent({
	components: {
		FilterField,
	},
	props: {
		collection: {
			type: String,
			required: true,
		},
		filters: {
			type: Array as PropType<Filter[]>,
			default: () => [],
		},
	},
	setup(props, { emit }) {
		const fieldsStore = useFieldsStore();
		const fields = computed<Field[]>(() => fieldsStore.getFieldsForCollection(props.collection));

		const statusField = fields.value.find(({ field }: Field) => field === 'status');
		/* Adds deselectable option to the statusfield */
		if (statusField?.meta?.options) statusField.meta.options.allowNone = true;

		const categoryField = fields.value.find(({ field }: Field) => field === 'category');

		return {
			fields,
			statusField,
			categoryField,
			handleFilters,
			getFilter,
			deleteFilter,
			createStatusFilter,
			_createCategoryFilter,
		};

		function handleFilters(filter: Filter) {
			const { key } = filter;

			const index = props.filters.findIndex((filter) => filter.key === key);

			if (index === -1) {
				emit('update:filters', [...(props.filters || []), filter]);
			} else {
				const removeDuplicates = props.filters.filter((filter) => filter.key !== key);
				emit('update:filters', [...(removeDuplicates || []), filter]);
			}
		}

		function getFilter(key: Filter['key']) {
			const filter = props.filters.find((filter) => filter.key === key);
			if (key === 'category' && filter) {
				/* Alias the value to the first item of the concatenated string, otherwise it 500s */
				const legalValue = filter.value.split(',')[0];
				return {
					...filter,
					value: legalValue,
				};
			}
			return filter;
		}

		function deleteFilter(key: Filter['key']) {
			const removeFilter = props.filters.filter((filter) => filter.key !== key);
			emit('update:filters', [...(removeFilter || [])]);
		}

		async function _createCategoryFilter(value: string) {
			const filter = await createCategoryFilter(value, categoryField!);

			handleFilters(filter);
		}
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';
.layout-filters {
	margin-bottom: 12px;
	margin-left: 32px;
}

.form-grid {
	@include form-grid;

	margin: 12px 0;
}
</style>
