<script setup lang="ts">
import { computed } from 'vue';
import { useAiStore } from '../stores/use-ai';
import AiInputSubmit from './ai-input-submit.vue';
import AiTextarea from './ai-textarea.vue';

const aiStore = useAiStore();

const canSubmit = computed(
	() =>
		aiStore.input.trim().length > 0 &&
		aiStore.status !== 'streaming' &&
		aiStore.status !== 'submitted' &&
		!aiStore.hasPendingToolCall,
);

function handleKeydown(event: KeyboardEvent) {
	if (!event.shiftKey) {
		event.preventDefault();

		if (canSubmit.value) {
			handleSubmit();
		}
	}
}

function handleSubmit() {
	if (!canSubmit.value) return;

	aiStore.submit();
}
</script>

<template>
	<div class="ai-input-container">
		<div class="input-wrapper">
			<ai-textarea
				ref="textarea-component"
				v-model="aiStore.input"
				:placeholder="$t('ai.prompt_input_placeholder')"
				autofocus
				@keydown.enter="handleKeydown"
			/>
			<div class="input-controls">
				<ai-input-submit
					:status="aiStore.status"
					:can-submit="canSubmit"
					@stop="aiStore.stop"
					@reload="aiStore.retry"
					@submit="handleSubmit"
				/>
			</div>
		</div>
	</div>
</template>

<style scoped>
.ai-input-container {
	padding: 0;
}

.input-wrapper {
	inline-size: 100%;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 8px;
	padding: 12px;
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--form--field--input--background);
	transition: border-color var(--fast) var(--transition);

	&:has(.ai-textarea:disabled) {
		background-color: var(--theme--form--field--input--background-subdued);
		border-color: var(--theme--form--field--input--border-color);
	}

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
