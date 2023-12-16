<script setup lang="ts">
withDefaults(
	defineProps<{
		name: string;
		icon: string;
		search?: string;
		color?: string;
	}>(),
	{
		color: 'var(--theme--foreground)',
	},
);
</script>

<template>
	<v-list-item-icon>
		<v-icon :name="icon" :color="color" />
	</v-list-item-icon>
	<v-list-item-content><v-text-overflow :text="name" :highlight="search" /></v-list-item-content>
</template>
