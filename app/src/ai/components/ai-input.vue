<script setup lang="ts">
import { useShortcut } from '@/composables/use-shortcut';
import { computed, ref, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import AiModelSelector from './ai-model-selector.vue';
import AiTextarea from './ai-textarea.vue';

const emit = defineEmits(['send']);

const { t } = useI18n();
const textareaComponent = useTemplateRef<InstanceType<typeof AiTextarea>>('textareaComponent');

useShortcut('meta+enter', handleSubmit, textareaComponent as any);

const content = ref('');
const focused = ref(false);
const sending = ref(false);

const canSubmit = computed(() => content.value.trim().length > 0 && !sending.value);

function handleSubmit() {
	if (!canSubmit.value) return;

	sending.value = true;

	emit('send', content.value);

	content.value = '';
	sending.value = false;
}

function handleFocus() {
	focused.value = true;
}

function handleBlur() {
	if (!content.value) {
		focused.value = false;
	}
}
</script>

<template>
	<div class="ai-input-container">
		<div class="input-wrapper">
			<AiTextarea
				ref="textareaComponent"
				v-model="content"
				:placeholder="t('ai.prompt_input_placeholder')"
				:disabled="sending"
				@focus="handleFocus"
				@blur="handleBlur"
			/>
			<div class="input-controls">
				<AiModelSelector />
				<v-button :disabled="!canSubmit" :loading="sending" class="submit-button" x-small icon @click="handleSubmit">
					<v-icon name="arrow_upward" />
				</v-button>
			</div>
		</div>
	</div>
</template>

<style scoped>
.ai-input-container {
	padding: 0;
}

.input-wrapper {
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 8px;
	padding: 12px;
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--form--field--input--background);
	transition: border-color var(--fast) var(--transition);

	&:hover {
		border-color: var(--theme--form--field--input--border-color-hover);
	}

	&:focus-within {
		border-color: var(--theme--primary);
	}
}

.input-controls {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-shrink: 0;

	.submit-button {
		--v-button-background-color-disabled: var(--theme--background-accent);
	}
}
</style>
