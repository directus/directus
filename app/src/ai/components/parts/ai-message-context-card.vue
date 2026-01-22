<script setup lang="ts">
import type { ContextAttachment } from '@directus/ai';
import { computed } from 'vue';
import VIcon from '@/components/v-icon/v-icon.vue';

const props = defineProps<{
	attachment: ContextAttachment;
}>();

const icon = computed(() => {
	switch (props.attachment.type) {
		case 'visual-element':
			return 'brush';
		case 'item':
			return 'database';
		case 'prompt':
			return 'chat';
		default:
			return 'attachment';
	}
});
</script>

<template>
	<div class="ai-message-context-card">
		<div class="icon-wrapper">
			<VIcon :name="icon" x-small class="item-icon" />
		</div>
		<p class="display-text">{{ attachment.display }}</p>
	</div>
</template>

<style scoped>
.ai-message-context-card {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 4px 8px;
	max-inline-size: 150px;
	background-color: var(--theme--background);
	border: 1px solid var(--theme--border-color);
	border-radius: var(--theme--border-radius);
}

.icon-wrapper {
	flex-shrink: 0;
	background-color: var(--theme--primary-background);
	padding: 2px;
	border-radius: var(--theme--border-radius);
	display: flex;
	align-items: center;
	justify-content: center;
}

.item-icon {
	--v-icon-color: var(--purple);
}

.display-text {
	flex: 1;
	min-inline-size: 0;
	font-size: 12px;
	font-weight: 500;
	color: var(--theme--foreground);
	line-height: 1.3;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	margin: 0;
}
</style>
