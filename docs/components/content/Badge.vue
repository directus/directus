<script setup>
defineProps({
	text: {
		type: String,
		required: true
	},
	small: {
		type: Boolean,
		default: false
	},
	iconBefore: {
		type: String
	},
	iconAfter: {
		type: String
	},
})
</script>

<template>
	<span class="badge" :class="{ small: small }">
		<Icon v-if="iconBefore" :name="iconBefore" :size="small ? '0.75rem' : '1rem'" />
		<span>{{ text }}</span>
		<Icon v-if="iconAfter" :name="iconAfter" :size="small ? '0.75rem' : '1rem'" />
	</span>
</template>

<style scoped>
.badge {
	background: transparent;
	color: var(--typography--subdued);
	border: 1px solid var(--typography--subdued);
	border-radius: 100em;
	text-transform: uppercase;
	text-decoration: none;
	padding: 0.2rem 0.5rem;
	font-weight: 500;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
}

.small {
	font-size: 0.75rem;
	padding: 0 0.1rem;
}
</style>
