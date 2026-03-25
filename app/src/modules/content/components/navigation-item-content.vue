<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';

withDefaults(
	defineProps<{
		name: string;
		icon: string;
		search?: string;
		color?: string | null;
	}>(),
	{
		color: 'var(--theme--foreground)',
	},
);
</script>

<template>
	<VListItemIcon>
		<VIcon :name="icon" :color="color" />
	</VListItemIcon>
	<VListItemContent><VTextOverflow :text="name" :highlight="search" /></VListItemContent>
</template>
