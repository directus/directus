<template>
	<v-input
		type="number"
		:class="font"
		:value="value"
		:placeholder="placeholder"
		:disabled="disabled"
		:min="minValue"
		:max="maxValue"
		:step="stepInterval"
		full-width
		@input="$listeners.input"
	>
		<template v-if="iconLeft" #prepend>
			<v-icon :name="iconLeft" />
		</template>
		<template v-if="iconRight" #append>
			<v-icon :name="iconRight" />
		</template>
	</v-input>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';

export default defineComponent({
	props: {
		value: {
			type: [Number, String],
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
		iconLeft: {
			type: String,
			default: null,
		},
		iconRight: {
			type: String,
			default: null,
		},
		stepInterval: {
			type: Number,
			default: 1,
		},
		placeholder: {
			type: String,
			default: null,
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
	&.monospace {
		--v-input-font-family: var(--family-monospace);
	}

	&.serif {
		--v-input-font-family: var(--family-serif);
	}

	&.sans-serif {
		--v-input-font-family: var(--family-sans-serif);
	}
}
</style>
