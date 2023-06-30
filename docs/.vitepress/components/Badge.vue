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

<style scoped>
.badge {
	color: #fe97dc;
	font-size: 14px;
	font-weight: 700;
	text-transform: uppercase;
}
</style>
