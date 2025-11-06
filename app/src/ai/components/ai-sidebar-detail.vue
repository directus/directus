<script setup lang="ts">
import { useGroupable } from '@directus/composables';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AiConversation from './ai-conversation.vue';
import { useSidebarStore } from '@/views/private/private-view/stores/sidebar';

const { t } = useI18n();
const sidebarStore = useSidebarStore();
const title = computed(() => t('ai_chat'));

useGroupable({
	value: title.value,
	group: 'sidebar-detail',
});
</script>

<template>
	<sidebar-detail :title icon="smart_toy" class="ai-sidebar">
		<div class="ai-sidebar-content">
			<ai-conversation v-if="!sidebarStore.collapsed" />
		</div>
	</sidebar-detail>
</template>

<style scoped>
.ai-sidebar :deep(.toggle.open ~ .scroll-container) {
	overflow: visible;
	display: flex;
	flex-direction: column;
	flex-grow: 999;
	min-block-size: 0;
}

.ai-sidebar :deep(.scroll-container > div) {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-block-size: 0;
}

.ai-sidebar :deep(.scroll-container > div > .content) {
	padding: 0;
	display: flex;
	flex-direction: column;
	flex: 1;
	min-block-size: 0;
}

.ai-sidebar-content {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-block-size: 0;
}
</style>
