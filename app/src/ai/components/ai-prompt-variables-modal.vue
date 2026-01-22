<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { MCPPrompt } from '../composables/use-prompts';

interface Props {
	prompt: MCPPrompt | null;
	variables: string[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
	submit: [values: Record<string, string>];
	cancel: [];
}>();

const modelValue = defineModel<boolean>({ required: true });

const { t } = useI18n();

const variableValues = ref<Record<string, string>>({});

const canSubmit = computed(() => {
	return props.variables.every((variable) => {
		const value = variableValues.value[variable];
		return value !== undefined && value !== null && value.trim().length > 0;
	});
});

function handleSubmit() {
	if (!canSubmit.value) return;

	emit('submit', { ...variableValues.value });
	closeDialog();
}

function closeDialog() {
	modelValue.value = false;
	variableValues.value = {};
}
</script>

<template>
	<v-dialog v-model="modelValue" persistent @esc="closeDialog">
		<v-card>
			<v-card-title>{{ prompt?.name ?? t('ai.insert_prompt') }}</v-card-title>

			<v-card-text>
				<p v-if="prompt?.description" class="prompt-description">{{ prompt.description }}</p>

				<div class="variables-form">
					<v-input
						v-for="variable in variables"
						:key="variable"
						v-model="variableValues[variable]"
						:label="variable"
						:placeholder="variable"
						autofocus
					/>
				</div>
			</v-card-text>

			<v-card-actions>
				<v-button secondary @click="closeDialog">
					{{ t('cancel') }}
				</v-button>
				<v-button :disabled="!canSubmit" @click="handleSubmit">
					{{ t('ai.insert_prompt') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<style scoped>
.prompt-description {
	margin-block-end: 1rem;
	color: var(--theme--foreground-subdued);
}

.variables-form {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}
</style>
