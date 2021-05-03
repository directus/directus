<template>
	<v-input
		:modelValue="value"
		:disabled="disabled"
		:placeholder="placeholder"
		:iconLeft="iconLeft"
		:iconRight="iconRight"
		@update:modelValue="$emit('input', $event)"
		slug
	>
		<template v-if="iconLeft" #prepend><v-icon :name="iconLeft" /></template>
		<template v-if="iconRight" #append><v-icon :name="iconRight" /></template>
	</v-input>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	emits: ['input'],
	props: {
		value: {
			type: String,
			default: null,
		},
		disabled: {
			type: Boolean,
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
		placeholder: {
			type: String,
			default: null,
		},
	},
});
</script>

<style lang="scss" scoped>
.v-input {
	--v-input-font-family: var(--family-monospace);
}
</style>
