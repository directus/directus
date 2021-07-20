<template>
	<div class="filter-setup">
		<filter-row
			v-for="(filter, field) of value"
			:key="field"
			:field="field"
			:filter="filter"
			:fields="fields"
			@filter="updateFilter(field, filter)"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FilterRow from './filter-row.vue';
import { useCollection } from '@/composables/use-collection';

export default defineComponent({
	name: 'system-filter-setup',
	components: { FilterRow },
	props: {
		collectionKey: {
			type: String,
			required: true,
		},
		value: {
			type: Object,
			default: () => ({}),
		},
	},
	setup(props) {
		const { fields } = useCollection(props.collectionKey);

		return { fields, updateFilter };

		function updateFilter(field: string, filter: Record<string, any>) {
			console.log(field, filter);
		}
	},
});
</script>
