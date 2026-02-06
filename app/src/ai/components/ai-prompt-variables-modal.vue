<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { MCPPrompt } from '../types';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VInput from '@/components/v-input.vue';

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
	<VDialog v-model="modelValue" persistent @esc="closeDialog">
		<VCard>
			<VCardTitle>{{ prompt?.name ?? t('ai.insert_prompt') }}</VCardTitle>
			<VCardText>
				<p v-if="prompt?.description" class="prompt-description">{{ prompt.description }}</p>
				<div class="variables-form">
					<VInput
						v-for="(variable, index) in variables"
						:key="variable"
						v-model="variableValues[variable]"
						:label="variable"
						:placeholder="variable"
						:autofocus="index === 0"
					/>
				</div>
			</VCardText>
			<VCardActions>
				<VButton secondary @click="closeDialog">
					{{ t('cancel') }}
				</VButton>
				<VButton :disabled="!canSubmit" @click="handleSubmit">
					{{ t('ai.insert_prompt') }}
				</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
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
