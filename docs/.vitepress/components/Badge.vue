<template>
	<component :is="as" class="badge">
		<slot />
	</component>
</template>

<script setup lang="ts">
withDefaults(
	defineProps<{
		as?: string;
	}>(),
	{
		as: 'p',
	}
);
</script>

<style>
.badge {
	color: var(--vp-c-pink);
	font-size: 14px;
	font-weight: 700;
	text-transform: uppercase;
}
.badge * {
	color: inherit !important;
}
</style>
