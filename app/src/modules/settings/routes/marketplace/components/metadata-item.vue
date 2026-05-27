<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';

withDefaults(
	defineProps<{
		icon: string;
		color?: 'primary' | 'subdued' | 'foreground' | 'warning';
		href?: string;
		to?: string;
		monospace?: boolean;
		hasTooltip?: boolean;
	}>(),
	{
		color: 'subdued',
	},
);
</script>

<template>
	<VListItem :class="[color, { 'has-tooltip': hasTooltip }]" :clickable="!!href || !!to" :href="href" :to="to">
		<VListItemIcon>
			<slot name="icon"><VIcon :name="icon" small /></slot>
		</VListItemIcon>
		<VListItemContent :class="{ monospace }"><slot /></VListItemContent>
	</VListItem>
</template>

<style scoped lang="scss">
.primary {
	--v-list-color: var(--theme--primary);
	--v-list-item-icon-color: var(--theme--primary);
}

.foreground {
	--v-list-color: var(--theme--foreground);
	--v-list-item-icon-color: var(--theme--foreground);
}

.subdued {
	--v-list-color: var(--theme--foreground-subdued);
	--v-list-item-icon-color: var(--theme--foreground-subdued);
}

.warning {
	--v-list-color: var(--theme--warning);
	--v-list-item-icon-color: var(--theme--warning);
}

.monospace {
	--v-list-item-content-font-family: var(--theme--fonts--monospace--font-family);
	font-weight: var(--theme--fonts--monospace--font-weight);
}

.has-tooltip {
	cursor: help;
}
</style>
