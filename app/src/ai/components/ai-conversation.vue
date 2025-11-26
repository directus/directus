<script setup lang="ts">
import { useTemplateRef, computed, onMounted, nextTick } from 'vue';
import { useScroll } from '@vueuse/core';
import { useAiStore } from '../stores/use-ai';
import { useUserStore } from '@/stores/user';
import AiMessageList from './ai-message-list.vue';
import AiInput from './ai-input.vue';
import AiHeader from './ai-header.vue';
import VInfo from '@/components/v-info.vue';

const aiStore = useAiStore();
const userStore = useUserStore();

const hasProviders = computed(() => aiStore.models.length > 0);

const emptyState = computed(() => {
	if (!hasProviders.value && userStore.isAdmin) {
		return {
			title: 'ai.setup_ai_chat',
			description: 'ai.setup_ai_chat_admin_description',
			showSettings: true,
		};
	}

	if (!hasProviders.value) {
		return {
			title: 'ai.setup_ai_chat',
			description: 'ai.setup_ai_chat_user_description',
			showSettings: false,
		};
	}

	if (aiStore.messages.length === 0) {
		return {
			title: 'ai.build_with_chat',
			description: 'ai.responses_may_be_inaccurate',
			showSettings: false,
		};
	}

	return null;
});

const messagesContainerRef = useTemplateRef<HTMLElement>('messages-container');

const { arrivedState } = useScroll(messagesContainerRef);

const showScrollButton = computed(() => {
	// Only show if we have messages and are not at the bottom
	return aiStore.messages.length > 0 && !arrivedState.bottom;
});

onMounted(() => {
	nextTick(() => {
		scrollToBottom('instant');
	});
});

aiStore.onSubmit(() => {
	scrollToBottom('smooth');
});

function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
	const el = messagesContainerRef.value;

	if (el) {
		el.scrollTo({ top: el.scrollHeight, behavior });
	}
}
</script>

<template>
	<div class="ai-conversation">
		<ai-header v-if="hasProviders" />
		<div ref="messages-container" class="messages-container">
			<ai-message-list :messages="aiStore.messages" :status="aiStore.status" />

			<v-info
				v-if="emptyState"
				icon="magic_button"
				type="primary"
				:title="$t(emptyState.title)"
				class="empty-state"
			>
				{{ $t(emptyState.description) }}
				<template v-if="emptyState.showSettings" #append>
					<v-button to="/settings/ai">{{ $t('ai.go_to_settings') }}</v-button>
				</template>
			</v-info>

			<v-notice v-if="aiStore.error" multiline type="danger" class="error-notice">
				<template #title>
					{{ $t('ai.error') }}
				</template>

				<p class="error-message">{{ aiStore.error?.message ?? $t('ai.unknown_error') }}</p>

				<div class="error-buttons-container">
					<v-button outlined class="retry-button" x-small danger @click="aiStore.retry()">
						<v-icon name="refresh" x-small />
						{{ $t('ai.retry') }}
					</v-button>
					<v-button class="clear-button" outline x-small danger @click="aiStore.reset()">
						{{ $t('ai.clear_conversation') }}
					</v-button>
				</div>
			</v-notice>

			<div id="scroll-anchor"></div>
		</div>

		<div v-if="hasProviders" class="input-container">
			<div v-show="showScrollButton" class="scroll-to-bottom-container">
				<v-button icon rounded secondary x-small class="scroll-to-bottom-btn" @click="scrollToBottom('smooth')">
					<v-icon small name="arrow_downward" />
				</v-button>
			</div>

			<ai-input />
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

.messages-container > * {
	overflow-anchor: none;
}

#scroll-anchor {
	overflow-anchor: auto;
	block-size: 1px;
}

.input-container {
	flex-shrink: 0;
	position: relative;
	padding-inline-end: 12px;
}

.error-message {
	margin-block-end: 1rem;
	font-size: 0.875rem;
	inline-size: 100%;
	max-inline-size: 100%;
	overflow-wrap: anywhere;
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

.scroll-to-bottom-container {
	position: absolute;
	inset-block-start: -36px;
	inset-inline-start: 50%;
	translate: -50% 0;
	z-index: 4;
	margin-block-start: auto;
	display: flex;
	justify-content: center;
	pointer-events: none;
}

.scroll-to-bottom-btn {
	box-shadow: 0 0 8px rgb(0 0 0 / 0.15);
	pointer-events: all;
}
</style>
