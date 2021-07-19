<template>
	<input :value="value" @input="handleChange($event.target.value)" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	emits: ['input'],
	props: {
		value: String,
	},
	methods: {
		handleChange(value) {
			this.$emit('input', value);
		},
	},
});
</script>
