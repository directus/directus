<script setup lang="ts">
import { useScroll } from '@vueuse/core';
import { nanoid } from 'nanoid';
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAiContextStore } from '../stores/use-ai-context';
import { useAiStore } from '../stores/use-ai';
import AiHeader from './ai-header.vue';
import AiInput from './ai-input.vue';
import AiMessageList from './ai-message-list.vue';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInfo from '@/components/v-info.vue';
import VNotice from '@/components/v-notice.vue';
import { useUserStore } from '@/stores/user';
import { notify } from '@/utils/notify';

const { t } = useI18n();
const aiStore = useAiStore();
const contextStore = useAiContextStore();
const userStore = useUserStore();

const dragging = ref(false);
let dragCounter = 0;

const hasProviders = computed(() => aiStore.models.length > 0);

const emptyState = computed(() => {
	if (!hasProviders.value && userStore.isAdmin) {
		return {
			title: 'ai.setup_ai_assistant',
			description: 'ai.setup_ai_assistant_admin_description',
			showSettings: true,
		};
	}

	if (!hasProviders.value) {
		return {
			title: 'ai.setup_ai_assistant',
			description: 'ai.setup_ai_assistant_user_description',
			showSettings: false,
		};
	}

	if (aiStore.messages.length === 0) {
		return {
			title: 'ai.build_with_assistant',
			description: 'ai.responses_may_be_inaccurate',
			showSettings: false,
		};
	}

	return null;
});

const messagesContainerRef = useTemplateRef<HTMLElement>('messages-container');

const { arrivedState } = useScroll(messagesContainerRef);

const showScrollButton = computed(() => {
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

function onDragEnter() {
	if (!aiStore.supportsFileUpload) return;

	dragCounter++;

	if (dragCounter === 1) {
		dragging.value = true;
	}
}

function onDragLeave() {
	dragCounter--;

	if (dragCounter === 0) {
		dragging.value = false;
	}
}

function onDrop(event: DragEvent) {
	dragCounter = 0;
	dragging.value = false;

	if (!aiStore.supportsFileUpload) {
		notify({ title: t('ai.file_upload_not_supported') });
		return;
	}

	const files = event.dataTransfer?.files;

	if (files) {
		for (const file of Array.from(files)) {
			contextStore.addPendingContext({
				id: nanoid(),
				type: 'local-file',
				data: { file },
				display: file.name,
			});
		}

		aiStore.focusInput();
	}
}
</script>

<template>
	<div
		class="ai-conversation"
		@dragenter.prevent="onDragEnter"
		@dragover.prevent
		@dragleave.prevent="onDragLeave"
		@drop.stop.prevent="onDrop"
	>
		<AiHeader v-if="hasProviders" />

		<div ref="messages-container" class="messages-container">
			<AiMessageList :messages="aiStore.messages" :status="aiStore.status" />

			<VInfo v-if="emptyState" icon="magic_button" type="primary" :title="$t(emptyState.title)" class="empty-state">
				{{ $t(emptyState.description) }}
				<template v-if="emptyState.showSettings" #append>
					<VButton to="/settings/ai">{{ $t('ai.go_to_settings') }}</VButton>
				</template>
			</VInfo>

			<VNotice v-if="aiStore.error" multiline type="danger" class="error-notice">
				<template #title>
					{{ $t('ai.error') }}
				</template>

				<p class="error-message">{{ aiStore.error?.message ?? $t('ai.unknown_error') }}</p>

				<div class="error-buttons-container">
					<VButton outlined class="retry-button" x-small danger @click="aiStore.retry()">
						<VIcon name="refresh" x-small />
						{{ $t('ai.retry') }}
					</VButton>
					<VButton class="clear-button" outline x-small danger @click="aiStore.reset()">
						{{ $t('ai.clear_conversation') }}
					</VButton>
				</div>
			</VNotice>

			<div id="scroll-anchor"></div>
		</div>

		<div v-if="hasProviders" class="input-container">
			<div v-show="showScrollButton" class="scroll-to-bottom-container">
				<VButton icon rounded secondary x-small class="scroll-to-bottom-btn" @click="scrollToBottom('smooth')">
					<VIcon small name="arrow_downward" />
				</VButton>
			</div>

			<AiInput />
		</div>

		<div v-if="dragging" class="drop-overlay">
			<VIcon class="upload-icon" x-large name="file_upload" />
			<p class="type-label">{{ $t('drop_to_upload') }}</p>
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
	position: relative;
}

.messages-container {
	position: relative;
	padding-inline: 8px;
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
	overflow-wrap: break-word;
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

.drop-overlay {
	position: absolute;
	inset: 0;
	z-index: 100;
	background-color: var(--theme--primary-background);
	border: 2px dashed var(--theme--primary);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	color: var(--theme--primary);
	pointer-events: none;

	.upload-icon {
		margin-block-end: 12px;
	}
}
</style>
