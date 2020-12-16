<template>
	<value-null v-if="!displayValue" />

	<span v-else>
		{{ displayValue }}
	</span>
</template>

<script lang="ts">
import { render } from 'micromustache';
import { defineComponent, computed } from '@vue/composition-api';

export default defineComponent({
	props: {
		value: {
			type: Object,
			default: null,
		},
		format: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const displayValue = computed(() => {
			if (!props.value) return null;
			try {
				return render(props.format || '', props.value);
			} catch (error) {
				return null;
			}
		});

		return { displayValue };
	},
});
</script>
