<template>
	<div class="custom-editor">
		<textarea :value="value" @input="handleChange(($event.target as HTMLTextAreaElement).value)" />
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		return { handleChange };

		function handleChange(value: string): void {
			emit('input', value);
		}
	},
});
</script>

<style scoped>
.custom-editor textarea {
	inline-size: 100%;
	min-block-size: 200px;
	font-family: monospace;
}
</style>
