<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';

defineProps<{
	icon: string;
	title: string;
	subtitle?: string;
	disabled?: boolean;
}>();

defineEmits<{
	(e: 'click'): void;
}>();
</script>

<template>
	<VListItem :disabled="disabled" clickable @click="$emit('click')">
		<VListItemIcon>
			<VIcon :name="icon" />
		</VListItemIcon>
		<VListItemContent>
			<div class="menu-item-content">
				<div class="menu-item-title">{{ title }}</div>
				<div v-if="subtitle" class="menu-item-subtitle">{{ subtitle }}</div>
			</div>
		</VListItemContent>
	</VListItem>
</template>

<style scoped>
.menu-item-content {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.menu-item-title {
	font-weight: 500;
	color: var(--theme--foreground);
}

.menu-item-subtitle {
	font-size: 12px;
	color: var(--theme--foreground-subdued);
}
</style>
