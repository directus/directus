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
.ai-sidebar :deep(.content) {
	padding: 0;
	display: flex;
	flex-direction: column;
	height: 100%;
}

.ai-sidebar-content {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 0;
}
</style>
