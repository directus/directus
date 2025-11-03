<script setup lang="ts">
import { useGroupable } from '@directus/composables';
import type { PrimaryKey } from '@directus/types';
import { computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';

import AiInput from './ai-input.vue';
import AiMessageList from './ai-message-list.vue';
import type { AiMessage, AiStatus } from './ai-message-list.vue';

const props = defineProps<{
	collection: string;
	primaryKey: PrimaryKey;
}>();

const { t } = useI18n();

const title = computed(() => t('ai_copilot'));

useGroupable({
	value: title.value,
	group: 'sidebar-detail',
});

const messages = ref<AiMessage[]>([
	{
		id: '1',
		content: 'This is a test message from a user',
		role: 'user',
	},
	{
		id: '2',
		content: 'This is a test message from an assistant',
		role: 'assistant',
	},
]);

const status = ref<AiStatus>('idle');
const loading = ref(false);

const { collection, primaryKey } = toRefs(props);

function addMessage(message: string) {

	messages.value.push({
		id: Date.now().toString(),
		content: message,
		role: 'user',
	});
}
</script>

<template>
	<sidebar-detail :title icon="smart_toy">
		<div class="messages-container">
			<AiMessageList
				:messages="messages"
				:status="status"
				:user-config="{ variant: 'primary', side: 'right', avatar: { icon: 'person' } }"
				:assistant-config="{ variant: 'subdued', side: 'left', avatar: { icon: 'smart_toy' } }"
				should-auto-scroll
				should-scroll-to-bottom
			/>
		</div>

		<v-progress-linear v-if="loading" indeterminate />

		<ai-input :collection="collection" :primary-key="primaryKey" @send="addMessage" />
	</sidebar-detail>
</template>

<style lang="scss" scoped>
.messages-container {
	flex: 1;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
}

.v-progress-linear {
	margin: 24px 0;
}
</style>
