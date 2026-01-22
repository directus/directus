<script setup lang="ts">
import AiEmptyState from './empty-state.vue';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VList from '@/components/v-list.vue';

withDefaults(
	defineProps<{
		title?: string;
		items: Record<string, any>[];
		showHeader?: boolean;
		itemKey?: string;
		emptyMessage?: string;
	}>(),
	{
		itemKey: 'id',
		emptyMessage: 'No results',
	},
);

defineEmits<{
	(e: 'back'): void;
}>();
</script>

<template>
	<div class="list-view-container">
		<div v-if="showHeader" class="list-header">
			<VButton x-small icon secondary @click="$emit('back')">
				<VIcon name="arrow_back" small />
			</VButton>
			<span class="list-title">{{ title }}</span>
		</div>

		<VList class="list-content">
			<template v-if="items.length > 0">
				<slot v-for="item in items" :key="item[itemKey]" name="item" :item="item" />
			</template>

			<slot v-else name="empty-state">
				<AiEmptyState :message="emptyMessage" />
			</slot>
		</VList>
	</div>
</template>

<style scoped>
.list-view-container {
	display: flex;
	flex-direction: column;
	max-block-size: 400px;
}

.list-header {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px;
	flex-shrink: 0;
	border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

.list-title {
	font-weight: 600;
	color: var(--theme--foreground);
	font-size: 14px;
}

.list-content {
	overflow-y: auto;
	flex-grow: 1;
}
</style>
