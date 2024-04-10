<script setup>
defineProps({
	text: {
		type: String,
		required: true
	},
})
</script>

<template>
	<span>{{ text }}</span>
</template>

<style scoped>
span {
	background: transparent;
	color: var(--typography--subdued);
	border: 1px solid var(--typography--subdued);
	border-radius: 100em;
	padding: 0.1rem 0.5rem;
	font-size: 0.75rem;
	text-transform: uppercase;
}
</style>
