<template>
	<div class="filter-setup">
		<filter-level
			root
			:fields="fields"
			:scope="Object.keys(filter)[0]"
			:value="Object.values(filter)[0]"
			@update:scope="updateScope"
			@update:value="updateValue"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import FilterLevel from './filter-level.vue';
import { useCollection } from '@/composables/use-collection';
import { FieldFilter } from '@directus/shared/types';

export default defineComponent({
	name: 'system-filter-setup',
	components: { FilterLevel },
	props: {
		collectionKey: {
			type: String,
			required: true,
		},
		value: {
			type: Object as PropType<FieldFilter>,
			default: () => ({}),
		},
	},
	setup(props, { emit }) {
		const { fields } = useCollection(props.collectionKey);

		const filter = computed<FieldFilter>({
			get() {
				return props.value;
			},
			set(newFilter: Object) {
				emit('input', newFilter);
			},
		});

		return { fields, filter, updateScope, updateValue };

		function updateScope(scope: string | null) {
			if (scope === null) {
				filter.value = {};
			} else {
				filter.value = {
					[scope]: {},
				};
			}
		}

		function updateValue(value: FieldFilter) {
			filter.value = {
				[Object.keys(filter.value)[0]]: value,
			};
		}
	},
});
</script>
