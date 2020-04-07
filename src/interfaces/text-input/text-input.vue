<template>
	<v-input
		:monospace="monospace"
		:value="value"
		:placeholder="placeholder"
		:disabled="disabled"
		full-width
		@input="$listeners.input"
	/>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		monospace: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: null,
		},
	},
});
</script>
