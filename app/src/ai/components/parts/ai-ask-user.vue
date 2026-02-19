<script setup lang="ts">
import formatTitle from '@directus/format-title';
import { onKeyStroke, useResizeObserver } from '@vueuse/core';
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
	type AskUserAnswers,
	type AskUserQuestion,
	cancelPending,
	pendingAskUser,
	submitAnswers,
} from '../../composables/use-ask-user-tool';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';

const { t } = useI18n();

const questions = computed(() => pendingAskUser.value?.input.questions ?? []);

const activeQuestionIndex = ref(0);
const answers = ref<Record<string, string | string[]>>({});
const textInputValues = ref<Record<string, string>>({});
const textInputActive = ref<Record<string, boolean>>({});

// Reset local state when questions change (e.g. consecutive ask_user calls)
watch(questions, () => {
	activeQuestionIndex.value = 0;
	answers.value = {};
	textInputValues.value = {};
	textInputActive.value = {};
});

const currentQuestion = computed<AskUserQuestion | undefined>(() => questions.value[activeQuestionIndex.value]);

function isAnswered(id: string): boolean {
	const answer = answers.value[id];
	const hasAnswer = Array.isArray(answer) ? answer.length > 0 : answer !== undefined;
	return hasAnswer || !!textInputValues.value[id];
}

const currentQuestionAnswered = computed(() => {
	if (!currentQuestion.value) return false;
	return isAnswered(currentQuestion.value.id);
});

const isLastQuestion = computed(() => activeQuestionIndex.value === questions.value.length - 1);

const slideDirection = ref<'forward' | 'backward'>('forward');

const rootEl = useTemplateRef<HTMLElement>('root-el');
const questionWrapperRef = useTemplateRef<HTMLElement>('question-wrapper');
const savedHeight = ref(0);
let rafId: number | null = null;

function onBeforeLeave() {
	const wrapper = questionWrapperRef.value;
	if (wrapper) savedHeight.value = wrapper.offsetHeight;
}

function onEnter() {
	const wrapper = questionWrapperRef.value;

	if (!wrapper) return;

	const newHeight = wrapper.offsetHeight;
	wrapper.style.height = `${savedHeight.value}px`;

	rafId = requestAnimationFrame(() => {
		wrapper.style.height = `${newHeight}px`;
	});
}

function onAfterEnter() {
	const wrapper = questionWrapperRef.value;
	if (wrapper) wrapper.style.height = '';
}

function selectOption(questionId: string, label: string, multiSelect: boolean) {
	if (multiSelect) {
		const current = (answers.value[questionId] as string[] | undefined) ?? [];

		if (current.includes(label)) {
			answers.value[questionId] = current.filter((v) => v !== label);
		} else {
			answers.value[questionId] = [...current, label];
		}
	} else {
		answers.value[questionId] = label;
		textInputValues.value[questionId] = '';
		textInputActive.value[questionId] = false;

		if (!isLastQuestion.value) {
			goToQuestion(activeQuestionIndex.value + 1);
		}
	}
}

function activateTextInput(questionId: string) {
	textInputActive.value[questionId] = true;

	if (typeof answers.value[questionId] === 'string' && !textInputValues.value[questionId]) {
		delete answers.value[questionId];
	}
}

function goToQuestion(index: number) {
	if (index >= 0 && index < questions.value.length) {
		activeQuestionIndex.value = index;
	}
}

function gatherAnswers(): AskUserAnswers {
	const result: AskUserAnswers = {};

	for (const q of questions.value) {
		const answer = answers.value[q.id];
		const textValue = textInputValues.value[q.id];

		if (answer !== undefined) {
			result[q.id] = answer;
		} else if (textValue) {
			result[q.id] = textValue;
		}
	}

	return result;
}

function handleSubmit() {
	submitAnswers(gatherAnswers());
}

function isOptionSelected(questionId: string, label: string): boolean {
	const answer = answers.value[questionId];

	if (Array.isArray(answer)) return answer.includes(label);
	return answer === label;
}

onKeyStroke('ArrowLeft', (e) => {
	if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
	goToQuestion(activeQuestionIndex.value - 1);
});

onKeyStroke('ArrowRight', (e) => {
	if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
	goToQuestion(activeQuestionIndex.value + 1);
});

// Enter key handling
onKeyStroke('Enter', (e) => {
	if (!currentQuestion.value) return;
	const q = currentQuestion.value;
	if (e.shiftKey || textInputActive.value[q.id]) return;

	e.preventDefault();

	if (isLastQuestion.value) {
		handleSubmit();
	} else {
		goToQuestion(activeQuestionIndex.value + 1);
	}
});

// Escape key handling
onKeyStroke('Escape', (e) => {
	e.preventDefault();

	if (!isLastQuestion.value) {
		goToQuestion(activeQuestionIndex.value + 1);
	}
});

// Number keys 1-4 for option selection or text input activation
onKeyStroke(['1', '2', '3', '4'], (e) => {
	if (!currentQuestion.value) return;
	if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
	const q = currentQuestion.value;
	const num = parseInt(e.key);
	const optionCount = q.options?.length ?? 0;

	if (num >= 1 && num <= optionCount && q.options) {
		e.preventDefault();
		selectOption(q.id, q.options[num - 1]!.label, q.multi_select);
	} else if (q.allow_text && num === optionCount + 1) {
		e.preventDefault();
		activateTextInput(q.id);
	}
});

// Tabs

const tabsContainerRef = useTemplateRef<HTMLElement>('tabs-container');
const showLeftFade = ref(false);
const showRightFade = ref(false);

function updateFades() {
	const el = tabsContainerRef.value;

	if (!el) return;

	showLeftFade.value = el.scrollLeft > 0;
	showRightFade.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
}

useResizeObserver(tabsContainerRef, updateFades);

watch(activeQuestionIndex, (newIndex, oldIndex) => {
	slideDirection.value = newIndex > oldIndex ? 'forward' : 'backward';

	nextTick(() => {
		const container = tabsContainerRef.value;

		if (!container) return;

		const activeTab = container.children[newIndex] as HTMLElement | undefined;

		activeTab?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
	});
});

onMounted(() => {
	nextTick(() => {
		rootEl.value?.focus();
		updateFades();
	});
});

onUnmounted(() => {
	if (rafId !== null) cancelAnimationFrame(rafId);
	// Safety net for non-standard unmount paths (e.g. parent route change)
	cancelPending();
});
</script>

<template>
	<div ref="rootEl" class="ai-ask-user" role="region" :aria-label="t('ai.ask_user')" tabindex="0">
		<div
			v-if="questions.length > 1"
			class="question-tabs-wrapper"
			:class="{
				'show-left-fade': showLeftFade,
				'show-right-fade': showRightFade,
			}"
		>
			<div ref="tabs-container" class="question-tabs" role="tablist" @scroll="updateFades">
				<button
					v-for="(q, index) in questions"
					:key="q.id"
					role="tab"
					:aria-selected="index === activeQuestionIndex"
					class="question-tab"
					:class="{
						active: index === activeQuestionIndex,
						answered: isAnswered(q.id),
					}"
					@click="goToQuestion(index)"
				>
					{{ formatTitle(q.id) }}
					<VIcon v-if="isAnswered(q.id)" name="check" x-small />
				</button>
			</div>
		</div>

		<div ref="question-wrapper" class="question-wrapper">
			<Transition
				:name="slideDirection === 'forward' ? 'slide-forward' : 'slide-backward'"
				mode="out-in"
				@before-leave="onBeforeLeave"
				@enter="onEnter"
				@after-enter="onAfterEnter"
			>
				<div v-if="currentQuestion" :key="currentQuestion.id" class="question-body">
					<p class="question-text">{{ currentQuestion.question }}</p>

					<!-- Text-only: render input directly -->
					<VInput
						v-if="currentQuestion.allow_text && !currentQuestion.options?.length"
						v-model="textInputValues[currentQuestion.id]"
						autofocus
						:placeholder="t('ai.ask_user_type_answer')"
						@keydown.enter.stop="!isLastQuestion ? goToQuestion(activeQuestionIndex + 1) : handleSubmit()"
					/>

					<!-- Has options -->
					<div v-else-if="currentQuestion.options?.length && currentQuestion.options.length > 0" class="options">
						<button
							v-for="(option, index) in currentQuestion.options"
							:key="option.label"
							:aria-pressed="isOptionSelected(currentQuestion.id, option.label)"
							class="option-card"
							:class="{ selected: isOptionSelected(currentQuestion.id, option.label) }"
							@click="selectOption(currentQuestion.id, option.label, currentQuestion.multi_select)"
						>
							<span class="option-number">
								<VIcon v-if="isOptionSelected(currentQuestion.id, option.label)" name="check" x-small />
								<template v-else>{{ index + 1 }}</template>
							</span>
							<div class="option-content">
								<span class="option-label">{{ option.label }}</span>
								<span v-if="option.description" class="option-description">{{ option.description }}</span>
							</div>
						</button>

						<!-- Options + allow_text: show card with click-to-activate -->
						<div
							v-if="currentQuestion.allow_text"
							class="option-card text-option"
							:class="{ active: textInputActive[currentQuestion.id] }"
							@click="!textInputActive[currentQuestion.id] && activateTextInput(currentQuestion.id)"
						>
							<template v-if="!textInputActive[currentQuestion.id]">
								<span class="option-number">{{ (currentQuestion.options?.length ?? 0) + 1 }}</span>
								<span class="option-content">
									<span class="option-label placeholder">{{ t('ai.ask_user_type_answer') }}</span>
								</span>
							</template>
							<template v-else>
								<VInput
									v-model="textInputValues[currentQuestion.id]"
									autofocus
									:placeholder="t('ai.ask_user_type_answer')"
									@keydown.enter.stop="!isLastQuestion ? goToQuestion(activeQuestionIndex + 1) : handleSubmit()"
								/>
							</template>
						</div>
					</div>

					<div class="actions">
						<button class="chat-about-this" @click="handleSubmit">
							{{ t('ai.ask_user_chat_about_this') }}
						</button>

						<div class="action-buttons">
							<VButton
								v-if="!isLastQuestion"
								x-small
								:secondary="!currentQuestionAnswered"
								@click="goToQuestion(activeQuestionIndex + 1)"
							>
								{{ currentQuestionAnswered ? t('ai.ask_user_next') : t('ai.ask_user_skip') }}
							</VButton>
							<VButton v-else x-small @click="handleSubmit">
								{{ t('ai.ask_user_submit') }}
							</VButton>
						</div>
					</div>
				</div>
			</Transition>
		</div>
	</div>
</template>

<style scoped>
.ai-ask-user {
	inline-size: 100%;
	padding: 12px;
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--form--field--input--background);
	outline: none;
	transition: border-color var(--fast) var(--transition);

	&:hover {
		border-color: var(--theme--form--field--input--border-color-hover);
	}

	&:focus-visible {
		border-color: var(--theme--primary);
	}
}

.question-wrapper {
	overflow: hidden;
	transition: height var(--fast) var(--transition);
	padding: calc(var(--focus-ring-width) + var(--focus-ring-offset));
	margin: calc(-1 * (var(--focus-ring-width) + var(--focus-ring-offset)));
}

.question-tabs-wrapper {
	--fade-size: 24px;
	--fade-color: var(--theme--form--field--input--background);

	position: relative;
	margin-block-end: 1rem;

	&::before,
	&::after {
		content: '';
		position: absolute;
		inset-block: 0;
		inline-size: var(--fade-size);
		pointer-events: none;
		z-index: 1;
		opacity: 0;
		transition: opacity var(--fast) var(--transition);
	}

	&::before {
		inset-inline-start: 0;
		background: linear-gradient(to right, var(--fade-color), transparent);
	}

	&::after {
		inset-inline-end: 0;
		background: linear-gradient(to left, var(--fade-color), transparent);
	}

	&.show-left-fade::before {
		opacity: 1;
	}

	&.show-right-fade::after {
		opacity: 1;
	}
}

.question-tabs {
	display: flex;
	gap: 0.375rem;
	padding-block: 4px;
	overflow-x: auto;
	scrollbar-width: none;

	&::-webkit-scrollbar {
		display: none;
	}
}

.question-tab {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.125rem 0.5rem;
	border-radius: var(--theme--border-radius);
	font-size: 0.75rem;
	font-weight: 500;
	color: var(--theme--foreground-subdued);
	background-color: var(--theme--background-normal);
	border: var(--theme--border-width) solid transparent;
	cursor: pointer;
	white-space: nowrap;
	transition:
		color var(--fast) var(--transition),
		background-color var(--fast) var(--transition),
		border-color var(--fast) var(--transition);

	&:hover {
		color: var(--theme--foreground);
		background-color: var(--theme--background-accent);
	}

	&.active {
		color: var(--theme--primary);
		background-color: var(--theme--primary-background);
		font-weight: 600;
	}

	&.answered {
		color: var(--theme--success);
	}

	&.active.answered {
		color: var(--theme--primary);
	}
}

.question-text {
	font-size: 0.9375rem;
	font-weight: 600;
	color: var(--theme--foreground);
	margin-block-end: 0.75rem;
	line-height: 1.4;
}

.options {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	max-block-size: 340px;
	overflow-y: auto;
	padding: calc(var(--focus-ring-width) + var(--focus-ring-offset));
	margin: calc(-1 * (var(--focus-ring-width) + var(--focus-ring-offset)));
}

.option-card {
	display: flex;
	align-items: center;
	gap: 0.625rem;
	padding: 0.625rem 0.75rem;
	border-radius: var(--theme--border-radius);
	border: var(--theme--border-width) solid var(--theme--border-color-accent);
	background-color: var(--theme--background);
	cursor: pointer;
	transition:
		border-color var(--fast) var(--transition),
		background-color var(--fast) var(--transition);
	text-align: start;
	inline-size: 100%;

	&:hover,
	&.selected {
		border-color: var(--theme--primary);
		background-color: var(--theme--primary-background);
	}

	&.text-option {
		cursor: default;

		&.active {
			padding: 0;
			border-color: transparent;
			background-color: transparent;
		}
	}
}

.option-number {
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	inline-size: 1.5rem;
	block-size: 1.5rem;
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--background-normal);
	font-size: 0.75rem;
	font-weight: 600;
	color: var(--theme--foreground-subdued);
}

.option-card.selected .option-number {
	background-color: var(--theme--primary);
	color: var(--theme--background);

	--v-icon-color: var(--theme--background);
}

.option-content {
	flex: 1;
	min-inline-size: 0;
}

.option-label {
	display: block;
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--theme--foreground);
	line-height: 1.3;

	&.placeholder {
		color: var(--theme--foreground-subdued);
	}
}

.option-description {
	display: block;
	font-size: 0.75rem;
	color: var(--theme--foreground-subdued);
	margin-block-start: 0.125rem;
	line-height: 1.3;
}

.actions {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-block-start: 0.75rem;
}

.action-buttons {
	display: flex;
	gap: 0.375rem;
}

.chat-about-this {
	font-size: 0.8125rem;
	color: var(--theme--foreground-subdued);
	background: none;
	border: none;
	padding: 0;
	cursor: pointer;
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--theme--foreground);
	}
}

.slide-forward-enter-active,
.slide-forward-leave-active,
.slide-backward-enter-active,
.slide-backward-leave-active {
	transition:
		opacity var(--fast) var(--transition),
		translate var(--fast) var(--transition);
}

.slide-forward-enter-from {
	opacity: 0;
	translate: 16px 0;
}

.slide-forward-leave-to {
	opacity: 0;
	translate: -16px 0;
}

.slide-backward-enter-from {
	opacity: 0;
	translate: -16px 0;
}

.slide-backward-leave-to {
	opacity: 0;
	translate: 16px 0;
}
</style>
