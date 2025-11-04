<script setup lang="ts">
import { useGroupable } from '@directus/composables';
import type { PrimaryKey } from '@directus/types';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AiConversation from './ai-conversation.vue';

// TODO: If context-aware AI features are added, reintroduce collection and primaryKey props.

const { t } = useI18n();

const title = computed(() => t('ai_chat'));

useGroupable({
	value: title.value,
	group: 'sidebar-detail',
});
</script>

<template>
	<sidebar-detail :title icon="smart_toy" class="ai-sidebar">
		<div class="ai-sidebar-content">
			<ai-conversation />
		</div>
	</sidebar-detail>
</template>

<style lang="scss" scoped>
.ai-sidebar {
	:deep(.content) {
		padding: 0;
		display: flex;
		flex-direction: column;
		height: 100%;
	}
}

.ai-sidebar-content {
	display: flex;
	flex-direction: column;
	height: 100%;
	min-height: 0;
}
</style>
