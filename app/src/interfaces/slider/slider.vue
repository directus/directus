<template>
	<v-slider
		:value="value"
		:disabled="disabled"
		:min="minValue"
		:max="maxValue"
		:step="stepInterval"
		:alwaysShowValue="alwaysShowValue"
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
			default: 0,
		},
		maxValue: {
			type: Number,
			default: 100,
		},
		stepInterval: {
			type: Number,
			default: 1,
		},
		alwaysShowValue: {
			type: Boolean,
			default: false,
		},
	},
});
</script>

<style lang="scss" scoped>
.v-slider {
	margin-top: 12px;
}
</style>
