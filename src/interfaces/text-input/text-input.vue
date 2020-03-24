<template>
	<v-input
		:monospace="options.monospace"
		:value="value"
		@input="$listeners.input"
		:placeholder="options.placeholder"
		full-width
	/>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { Options } from './types';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		options: {
			type: Object as PropType<Options>,
			required: true,
		},
	},
});
</script>
