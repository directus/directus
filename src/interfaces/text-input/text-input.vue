<template>
	<v-input
		:value="value"
		:placeholder="placeholder"
		:disabled="disabled"
		:trim="trim"
		:type="masked ? 'password' : 'text'"
		:class="font"
		full-width
		@input="$listeners.input"
	>
		<template v-if="iconLeft" #prepend><v-icon :name="iconLeft" /></template>
		<template v-if="iconRight" #append><v-icon :name="iconRight" /></template>
	</v-input>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';

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
		masked: {
			type: Boolean,
			default: false,
		},
		iconLeft: {
			type: String,
			default: null,
		},
		iconRight: {
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
.v-input {
	.monospace {
		--v-input-font-family: var(--family-monospace);
	}

	.serif {
		--v-input-font-family: var(--family-serif);
	}

	.sans-serif {
		--v-input-font-family: var(--family-sans-serif);
	}
}
</style>
