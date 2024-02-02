<script setup lang="ts">
withDefaults(
	defineProps<{
		icon: string;
		color?: 'primary' | 'subdued';
		href?: string;
	}>(),
	{
		color: 'subdued',
	},
);
</script>

<template>
	<v-list-item block :class="color" :clickable="!!href" :href="href">
		<v-list-item-icon><v-icon :name="icon" /></v-list-item-icon>
		<v-list-item-content><slot /></v-list-item-content>
		<v-list-item-hint v-if="href"><v-icon name="open_in_new" /></v-list-item-hint>
	</v-list-item>
</template>

<style scoped lang="scss">
.primary {
	--v-list-color: var(--theme--primary);
	--v-list-item-icon-color: var(--theme--primary);
}

.subdued {
	--v-list-color: var(--theme--foreground-subdued);
	--v-list-item-icon-color: var(--theme--foreground-subdued);
}
</style>
