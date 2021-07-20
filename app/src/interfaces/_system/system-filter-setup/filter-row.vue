<template>
	<div>
		<v-select :model-value="field" :items="fields" item-key="field" item-value="field" item-text="name" />
	</div>
</template>

<script lang="ts">
import { Field } from '@directus/shared/types';
import { defineComponent, PropType } from 'vue';

export default defineComponent({
	name: 'filter-row',
	props: {
		field: {
			type: String,
			required: true,
		},
		filter: {
			type: Object as PropType<Record<string, any>>,
			required: true,
		},
		fields: {
			type: Array as PropType<Field[]>,
			required: true,
		},
	},
	setup() {},
});
</script>
