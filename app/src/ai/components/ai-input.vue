<script setup lang="ts">
import { useShortcut } from '@/composables/use-shortcut';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AiModelSelector from './ai-model-selector.vue';

defineProps<{
	collection: string;
	primaryKey: string | number;
}>();

const emit = defineEmits(['send', 'cancel']);

const { t } = useI18n();
const textareaElement = ref<HTMLTextAreaElement>();

useShortcut('meta+enter', handleSubmit, textareaElement);

const content = ref('');
const focused = ref(false);
const sending = ref(false);

const collapsed = computed(() => !content.value && !focused.value);
const canSubmit = computed(() => content.value.trim().length > 0 && !sending.value);

function handleCancel() {
	content.value = '';
	focused.value = false;
	emit('cancel');
}

function handleSubmit() {
	if (!canSubmit.value) return;

	sending.value = true;

	// Emit submit event with content
	emit('send', content.value);

	// Clear input after submit
	content.value = '';
	sending.value = false;
}

function handleFocus() {
	focused.value = true;
}

function handleBlur() {
	// Only blur if there's no content
	if (!content.value) {
		focused.value = false;
	}
}
</script>

<template>
	<div class="ai-input-container" :class="{ collapsed }">
		<v-textarea
			ref="textareaElement"
			v-model="content"
			:placeholder="t('ai_prompt_input_placeholder')"
			:disabled="sending"
			@focus="handleFocus"
			@blur="handleBlur"
		/>
		<div class="buttons">
			<v-button x-small secondary icon>
				<v-icon name="add" />
			</v-button>
			<v-button x-small secondary icon>
				<v-icon name="language" />
			</v-button>
			<AiModelSelector />


			<div class="spacer"></div>
			<v-button class="cancel" x-small secondary @click="handleCancel">
				{{ t('cancel') }}
			</v-button>
			<v-button :disabled="!canSubmit" :loading="sending" class="submit-button" x-small @click="handleSubmit">
				{{ t('submit') }}
			</v-button>
		</div>
	</div>
</template>

<style scoped lang="scss">
.ai-input-container {
	position: relative;
	padding: 0;
}

.v-textarea {
	transition:
		block-size var(--fast) var(--transition),
		padding var(--fast) var(--transition);
}

.collapsed .v-textarea {
	:deep(textarea) {
		min-block-size: 48px;
	}
}

.buttons {
	margin-block-start: 8px;
	display: flex;
	gap: 8px;

	.cancel {
		--v-button-color: var(--theme--foreground-subdued);
	}

	.submit-button {
		--v-button-background-color-disabled: var(--theme--background-accent);
	}
}

.spacer {
	flex-grow: 1;
}
</style>
