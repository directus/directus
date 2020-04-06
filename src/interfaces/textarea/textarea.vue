<template>
	<v-textarea
		v-model="value"
		:placeholder="placeholder"
		:monospace="monospace"
		:rows="rows"
		full-width
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
		placeholder: {
			type: String,
			default: null,
		},
		monospace: {
			type: Boolean,
			default: false,
		},
	},
});
</script>
