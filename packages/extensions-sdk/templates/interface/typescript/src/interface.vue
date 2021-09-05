<template>
	<input :value="value" @input="handleChange($event.target.value)" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		value: {
			type: String,
			required: true,
		},
	},
	emits: ['input'],
	methods: {
		handleChange(value: string) {
			this.$emit('input', value);
		},
	},
});
</script>
