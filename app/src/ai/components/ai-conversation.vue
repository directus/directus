<script setup lang="ts">
import { useAiStore } from '../stores/use-ai';
import AiMessageList from './ai-message-list.vue';
import AiInput from './ai-input.vue';
import VInfo from '@/components/v-info.vue';

const aiStore = useAiStore();
</script>

<template>
	<div class="ai-conversation">
		<div class="messages-container">
			<ai-message-list
				:messages="aiStore.messages"
				:status="aiStore.status"
				should-auto-scroll
				should-scroll-to-bottom
			/>

			<VInfo v-if="aiStore.messages.length === 0" icon="smart_toy" :title="$t('ai.build_with_chat')" type="primary" class="empty-state">
				{{ $t('ai.responses_may_be_inaccurate') }}
			</VInfo>

			<v-notice v-if="aiStore.error" multiline type="danger" class="error-notice">
				<template #title>
					{{ $t('ai.error') }}
				</template>

				<p class="error-message">{{ aiStore.error?.message ?? $t('ai.unknown_error') }}</p>

				<div class="error-buttons-container">
					<v-button outlined class="retry-button" x-small danger @click="aiStore.retry()"><v-icon name="refresh" x-small />{{ $t('ai.retry') }}</v-button>
					<v-button class="clear-button" outline x-small danger @click="aiStore.reset()">{{ $t('ai.clear_conversation') }}</v-button>
				</div>
			</v-notice>
		</div>

		<div class="input-container">
			<ai-input @send="aiStore.addMessage" />
		</div>
	</div>
</template>

<style scoped>
.error-notice {
	margin-block-end: 1rem;
	max-inline-size: 100%;
	overflow: hidden;
}

.ai-conversation {
	display: flex;
	flex-direction: column;
	flex: 1;
	min-block-size: 0;
	block-size: 100%;
}

.messages-container {
	position: relative;
	flex: 1;
	overflow-y: auto;
	min-block-size: 0;
}

.input-container {
	flex-shrink: 0;
}

.error-message {
	margin-block-end: 1rem;
	font-size: 0.875rem;
	inline-size: 100%;
	max-inline-size: 100%;
	word-break: break-word;
}

.error-buttons-container {
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;

	margin-block-start: 1rem;
	align-items: center;

	.v-icon {
		margin-inline-end: 0.25rem;
	}
}

.empty-state {
	margin-block-start: 30%;
}
</style>
