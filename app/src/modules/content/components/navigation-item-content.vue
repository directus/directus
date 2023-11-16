<script setup lang="ts">
withDefaults(
	defineProps<{
		name: string;
		search?: string;
		icon?: string;
		color?: string;
	}>(),
	{
		icon: 'label',
		color: 'var(--theme--foreground)',
	}
);
</script>

<template>
	<v-list-item-icon>
		<v-icon :name="icon ?? 'label'" :color="color" />
	</v-list-item-icon>
	<v-list-item-content><v-text-overflow :text="name" :highlight="search" /></v-list-item-content>
</template>
