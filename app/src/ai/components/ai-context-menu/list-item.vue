<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';

defineProps<{
	title: string;
	description?: string;
	icon?: string;
	badge?: string;
	disabled?: boolean;
}>();

defineEmits<{
	(e: 'click'): void;
}>();
</script>

<template>
	<VListItem :disabled="disabled" clickable class="list-item" @click="$emit('click')">
		<VListItemIcon v-if="icon">
			<VIcon :name="icon" />
		</VListItemIcon>
		<VListItemContent>
			<div class="list-item-content">
				<div class="list-item-header">
					<span class="list-item-title">{{ title }}</span>
					<span v-if="badge" class="list-item-badge">{{ badge }}</span>
				</div>
				<div v-if="description" class="list-item-description">
					{{ description }}
				</div>
			</div>
		</VListItemContent>
	</VListItem>
</template>

<style scoped>
.list-item-content {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.list-item-header {
	display: flex;
	align-items: center;
	gap: 8px;
	font-weight: 600;
	color: var(--theme--foreground);
}

.list-item-badge {
	display: inline-flex;
	padding: 2px 6px;
	font-size: 10px;
	font-weight: 500;
	text-transform: uppercase;
	background-color: var(--theme--primary-background);
	color: var(--theme--primary);
	border-radius: var(--theme--border-radius);
	letter-spacing: 0.5px;
}

.list-item-description {
	font-size: 12px;
	color: var(--theme--foreground-subdued);
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	line-clamp: 2;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}
</style>
