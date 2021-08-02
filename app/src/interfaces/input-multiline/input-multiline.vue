<template>
	<v-textarea
		v-bind="{ placeholder, trim }"
		:model-value="value"
		:nullable="!clear"
		:disabled="disabled"
		:class="font"
		@update:model-value="$emit('input', $event)"
	/>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

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
	emits: ['input'],
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
