<template>
	<FormattedValue class="display-related-count" :value="count" type="number" v-bind="$attrs" />
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import { get } from 'lodash';
import FormattedValue from '../formatted-value/formatted-value.vue';

export default defineComponent({
	components: { FormattedValue },
	props: {
		value: {
			type: [String, Number],
			default: null,
		},
		field: {
			type: String,
			required: true,
		},
		rootItem: {
			type: Object as PropType<Record<string, any>>,
			required: true,
		},
	},
	setup(props) {
		const count = computed(() => get(props.rootItem, `${props.field}_count`) ?? 0);

		return { count };
	},
});
</script>
