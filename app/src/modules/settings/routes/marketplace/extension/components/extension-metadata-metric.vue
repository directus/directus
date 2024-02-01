<script setup lang="ts">
withDefaults(
	defineProps<{
		icon: string;
		color?: 'primary' | 'subdued';
	}>(),
	{
		color: 'subdued',
	},
);
</script>

<template>
	<p :class="color">
		<v-icon :name="icon" />
		<slot />
	</p>
</template>

<style scoped lang="scss">
.primary {
	color: var(--theme--primary);
}

.subdued {
	color: var(--theme--foreground-subdued);
}
</style>
