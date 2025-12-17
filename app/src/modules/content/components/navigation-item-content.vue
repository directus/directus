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
	<v-list-item-icon>
		<v-icon :name="icon" :color="color" />
	</v-list-item-icon>
	<v-list-item-content><v-text-overflow :text="name" :highlight="search" /></v-list-item-content>
</template>
