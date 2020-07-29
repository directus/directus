<template>
	<v-input :value="value" :disabled="disabled" @input="$emit('input', $event)" slug />
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
