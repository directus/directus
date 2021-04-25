<template>
	<v-textarea
		v-bind="{ placeholder, trim }"
		:value="value"
		:nullable="!clear"
		:disabled="disabled"
		:class="font"
		@input="$listeners.input"
	/>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		clear: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: null,
		},
		trim: {
			type: Boolean,
			default: true,
		},
		font: {
			type: String as PropType<'sans-serif' | 'serif' | 'monospace'>,
			default: 'sans-serif',
		},
	},
});
</script>

<style lang="scss" scoped>
.v-textarea {
	&.monospace {
		--v-textarea-font-family: var(--family-monospace);
	}

	&.serif {
		--v-textarea-font-family: var(--family-serif);
	}

	&.sans-serif {
		--v-textarea-font-family: var(--family-sans-serif);
	}
}
</style>
