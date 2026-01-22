<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';

defineProps<{
	title: string;
	icon?: string;
	subtitle?: string;
	badge?: string;
	disabled?: boolean;
}>();

defineEmits<{
	(e: 'click'): void;
}>();
</script>

<template>
	<VListItem :disabled="disabled" clickable @click="$emit('click')">
		<VListItemIcon v-if="icon">
			<VIcon :name="icon" />
		</VListItemIcon>
		<VListItemContent>
			<div class="item-content">
				<div class="item-header">
					<span class="item-title">{{ title }}</span>
					<span v-if="badge" class="item-badge">{{ badge }}</span>
				</div>
				<div v-if="subtitle" class="item-subtitle">
					{{ subtitle }}
				</div>
			</div>
		</VListItemContent>
	</VListItem>
</template>

<style scoped>
.item-content {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.item-header {
	display: flex;
	align-items: center;
	gap: 8px;
	font-weight: 500;
	color: var(--theme--foreground);
}

.item-badge {
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

.item-subtitle {
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
