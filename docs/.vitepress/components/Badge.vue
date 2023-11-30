<script setup lang="ts">
withDefaults(
	defineProps<{
		as?: string;
	}>(),
	{
		as: 'p',
	},
);
</script>

<template>
	<component :is="as" class="badge">
		<slot />
	</component>
</template>

<style scoped>
.badge {
	color: var(--vp-c-pink);
	font-size: 14px;
	font-weight: 700;
	text-transform: uppercase;
}
.badge :deep(*) {
	color: inherit !important;
}
</style>
