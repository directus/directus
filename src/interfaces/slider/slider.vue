<template>
	<v-slider
		:value="value"
		:disabled="disabled"
		:min="minValue"
		:max="maxValue"
		:step="stepInterval"
		show-thumb-label
		show-ticks
		@input="$listeners.input"
	/>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	props: {
		value: {
			type: Number,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		minValue: {
			type: Number,
			default: null,
		},
		maxValue: {
			type: Number,
			default: null,
		},
		stepInterval: {
			type: Number,
			default: 1,
		},
	},
});
</script>
