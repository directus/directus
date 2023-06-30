<template>
	<div v-if="contributors">
		<p>
			<b>Contributors:</b>
			<span>{{ contributors }}</span>
		</p>
	</div>
</template>

<script setup lang="ts">
defineProps<{ contributors?: string }>();
</script>

<style scoped>
p {
	border: 1px solid var(--vp-c-divider);
	padding: 1em;
	border-radius: 8px;
}
b {
	margin-right: 0.5em;
}
</style>
