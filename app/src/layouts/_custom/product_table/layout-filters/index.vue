<template>
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
				@input="handleFilters(createCategoryFilter($event))"
				@unset="deleteFilter"
			/>
		</div>
		<v-button x-small @click="$emit('update:filters', null)" class="field full" :disabled="!filters.length > 0">
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
		const categoryField = fields.value.find(({ field }: Field) => field === 'category');

		if (statusField?.meta?.options) statusField.meta.options.allowNone = true;

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
			return props.filters.find((filter) => filter.key === key);
		}

		function deleteFilter(key: Filter['key']) {
			const removeFilter = props.filters.filter((filter) => filter.key !== key);
			emit('update:filters', [...(removeFilter || [])]);
		}

		return {
			fields,
			statusField,
			categoryField,
			handleFilters,
			getFilter,
			deleteFilter,
			createStatusFilter,
			createCategoryFilter,
		};
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.form-grid {
	@include form-grid;

	margin-left: 32px;
}
</style>
