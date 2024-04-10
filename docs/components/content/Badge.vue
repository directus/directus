<script setup>
defineProps({
	text: {
		type: String,
		required: true
	},
	small: {
		type: Boolean,
		default: false
	}
})
</script>

<template>
	<span :class="{ small: small }">{{ text }}</span>
</template>

<style scoped>
span {
	background: transparent;
	color: var(--typography--subdued);
	border: 1px solid var(--typography--subdued);
	border-radius: 100em;
	text-transform: uppercase;
	text-decoration: none;
	padding: 0.2rem 0.75rem;
	font-weight: 500;
}

.small {
	font-size: 0.75rem;
	padding: 0.1rem 0.5rem;
}
</style>
