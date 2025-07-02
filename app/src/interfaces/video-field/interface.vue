<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
	value: {
		// The current value of the field in Directus
		type: String, // Or whatever type your field is
		default: null,
	},
	// 'placeholder' prop comes from the 'options' defined in index.ts
	placeholder: {
		type: String,
		default: '',
	},
});

const emits = defineEmits(['input']); // <-- IMPORTANT: Emit 'input' to update the field in Directus

function handleChange(newValue) {
	emits('input', newValue); // Emit the new value
}
</script>

<template>
	<input
		:value="value"
		@input="handleChange($event.target.value)"
		:placeholder="placeholder || 'Enter video URL or ID'"
		class="video-input-field"
	/>
</template>

<style scoped>
/* Basic styling for your input */
.video-input-field {
	width: 100%;
	padding: 10px 12px;
	border: 1px solid var(--border-normal); /* Use Directus CSS variables */
	border-radius: var(--border-radius-small);
	background-color: var(--background-page);
	color: var(--foreground-normal);
	font-family: var(--family-monospace); /* Example: match Directus font */
	box-sizing: border-box; /* Include padding and border in the element's total width and height */
}
.video-input-field:focus {
	outline: none;
	border-color: var(--primary); /* Highlight on focus */
	box-shadow: 0 0 0 2px var(--primary-alpha-25);
}
</style>
