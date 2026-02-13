<script setup lang="ts">
import type { DynamicToolUIPart } from 'ai';
import { computed } from 'vue';
import type { AskUserAnswers, AskUserInput } from '../../composables/use-ask-user-tool';

const props = defineProps<{
	part: DynamicToolUIPart;
}>();

const questions = computed(() => (props.part.input as AskUserInput | undefined)?.questions ?? []);
const output = computed(() => (props.part.output as AskUserAnswers) ?? {});

function getAnswer(questionId: string): string | undefined {
	const val = output.value[questionId];
	if (!val) return undefined;
	if (Array.isArray(val)) return val.join(', ');
	return val;
}
</script>

<template>
	<div class="ask-user-summary">
		<div v-for="q in questions" :key="q.id" class="completed-answer">
			<p class="completed-question">{{ q.question }}</p>
			<span v-if="getAnswer(q.id)" class="completed-value">{{ getAnswer(q.id) }}</span>
			<span v-else class="completed-skipped">{{ $t('ai.ask_user_skipped') }}</span>
		</div>
	</div>
</template>

<style scoped>
.ask-user-summary {
	inline-size: 100%;
	padding: 0.25rem;
}

.completed-answer {
	padding: 0.375rem 0;

	& + & {
		border-block-start: var(--theme--border-width) solid var(--theme--border-color-subdued);
	}
}

.completed-question {
	font-size: 0.75rem;
	color: var(--theme--foreground-subdued);
	margin-block-end: 0.125rem;
}

.completed-value {
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--theme--foreground);
}

.completed-skipped {
	font-size: 0.875rem;
	font-style: italic;
	color: var(--theme--foreground-subdued);
}
</style>
