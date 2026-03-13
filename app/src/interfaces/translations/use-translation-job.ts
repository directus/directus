import type { Field } from '@directus/types';
import { useEventListener } from '@vueuse/core';
import { computed, type ComputedRef, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
	buildAiTranslationPrompt,
	getAiTranslationFieldDescription,
	normalizeAiTranslatedFields,
} from './ai-translation';
import type { AppModelDefinition } from '@/ai/models';
import api from '@/api';
import type { RelationM2M } from '@/composables/use-relation-m2m';
import type { DisplayItem } from '@/composables/use-relation-multiple';
import { useSettingsStore } from '@/stores/settings';

export type LangStatus = 'pending' | 'translating' | 'retrying' | 'done' | 'error';

export type LangStatusEntry = {
	status: LangStatus;
	fieldCount?: number;
	error?: string;
};

export type TranslationJobConfig = {
	sourceLanguage: string;
	selectedFields: string[];
	targetLanguages: string[];
	model: AppModelDefinition;
	sourceContent: Record<string, string>;
	fieldDefinitions: Field[];
};

const MAX_RETRIES = 3;

export function useTranslationJob(options: {
	applyTranslatedFields: (fields: Record<string, string>, lang: string | undefined) => void;
	languageOptions: ComputedRef<Record<string, any>[]>;
	displayItems: ComputedRef<DisplayItem[]>;
	fields: ComputedRef<Field[]>;
	relationInfo: ComputedRef<RelationM2M | undefined>;
	getItemWithLang: (items: Record<string, any>[], lang: string | undefined) => DisplayItem | undefined;
}) {
	const { t } = useI18n();
	const settingsStore = useSettingsStore();

	const jobState = ref<'idle' | 'translating' | 'complete'>('idle');
	const langStatuses = ref<Record<string, LangStatusEntry>>({});
	const cancelled = ref(false);
	const abortControllers = ref<Map<string, AbortController>>(new Map());

	// Snapshot of the config used for the current/last job
	let jobConfig: TranslationJobConfig | null = null;

	const isTranslating = computed(() => jobState.value === 'translating');

	const hasErrors = computed(() => Object.values(langStatuses.value).some((s) => s.status === 'error'));

	const completedCount = computed(
		() => Object.values(langStatuses.value).filter((s) => s.status === 'done' || s.status === 'error').length,
	);

	const translatedCount = computed(() => Object.values(langStatuses.value).filter((s) => s.status === 'done').length);

	const totalCount = computed(() => Object.keys(langStatuses.value).length);

	const progressPercent = computed(() =>
		totalCount.value > 0 ? Math.round((completedCount.value / totalCount.value) * 100) : 0,
	);

	const progressLabel = computed(() => `${completedCount.value}/${totalCount.value}`);

	const pendingLanguages = computed(() => {
		const pending = new Set<string>();

		for (const [lang, entry] of Object.entries(langStatuses.value)) {
			if (entry.status === 'pending' || entry.status === 'translating' || entry.status === 'retrying') {
				pending.add(lang);
			}
		}

		return pending;
	});

	const pendingFields = computed(() => {
		if (!jobConfig || jobState.value === 'idle') return new Set<string>();
		return new Set(jobConfig.selectedFields);
	});

	// Prevent browser tab close while translating
	useEventListener(document, 'beforeunload', (event: BeforeUnloadEvent) => {
		if (isTranslating.value) {
			event.preventDefault();
		}
	});

	function start(config: TranslationJobConfig) {
		// Cancel any prior job
		cancel();

		// Snapshot config
		jobConfig = { ...config };

		jobState.value = 'translating';
		cancelled.value = false;
		langStatuses.value = {};

		// Init statuses for all targets
		for (const langCode of config.targetLanguages) {
			langStatuses.value[langCode] = { status: 'pending' };
		}

		// Fire all concurrently
		void Promise.allSettled(config.targetLanguages.map((langCode) => translateLanguage(langCode))).then(() => {
			if (!cancelled.value) {
				jobState.value = 'complete';
			}
		});
	}

	function cancel() {
		cancelled.value = true;

		for (const controller of abortControllers.value.values()) {
			controller.abort();
		}

		abortControllers.value.clear();
		jobState.value = 'idle';
	}

	function reset() {
		cancel();
		langStatuses.value = {};
		jobConfig = null;
	}

	async function retry(langCode: string) {
		await translateLanguage(langCode);

		// Check if all done after retry
		const allDone = Object.values(langStatuses.value).every((s) => s.status === 'done' || s.status === 'error');

		if (allDone && !Object.values(langStatuses.value).some((s) => s.status === 'error')) {
			jobState.value = 'complete';
		}
	}

	async function translateLanguage(langCode: string, retryCount = 0): Promise<void> {
		if (cancelled.value || !jobConfig) return;

		langStatuses.value[langCode] = { status: retryCount > 0 ? 'retrying' : 'translating' };

		const config = jobConfig;
		const fieldsWithContent = Object.keys(config.sourceContent);

		const selectedFieldDefinitions = fieldsWithContent
			.map((fieldName) => config.fieldDefinitions.find((f) => f.field === fieldName))
			.filter((field): field is Field => field !== undefined);

		const fieldProperties: Record<string, any> = {};

		for (const field of selectedFieldDefinitions) {
			fieldProperties[field.field] = {
				type: 'string',
				description: getAiTranslationFieldDescription(field),
			};
		}

		const outputSchema = {
			type: 'object',
			properties: fieldProperties,
			required: fieldsWithContent,
		};

		const langName = options.languageOptions.value.find((l) => l.value === langCode)?.text ?? langCode;

		const sourceLangName =
			options.languageOptions.value.find((l) => l.value === config.sourceLanguage)?.text ?? config.sourceLanguage;

		const prompt = buildAiTranslationPrompt({
			sourceLangName,
			targetLangNames: [langName],
			sourceContent: config.sourceContent,
			fields: selectedFieldDefinitions,
			styleGuide: settingsStore.settings?.ai_translation_style_guide,
			glossary: settingsStore.settings?.ai_translation_glossary,
		});

		const abortController = new AbortController();
		abortControllers.value.set(langCode, abortController);

		try {
			const response = await api.post(
				'/ai/object',
				{
					provider: config.model.provider,
					model: config.model.model,
					prompt,
					outputSchema,
				},
				{
					signal: abortController.signal,
				},
			);

			abortControllers.value.delete(langCode);

			if (cancelled.value) return;

			const translations = response.data.data;

			options.applyTranslatedFields(normalizeAiTranslatedFields(translations, selectedFieldDefinitions), langCode);

			langStatuses.value[langCode] = {
				status: 'done',
				fieldCount: Object.keys(translations).length,
			};
		} catch (error: any) {
			abortControllers.value.delete(langCode);

			if (cancelled.value) return;
			if (error?.name === 'CanceledError' || error?.name === 'AbortError') return;

			const statusCode = error?.response?.status;

			// Rate limit — auto-retry with exponential backoff
			if (statusCode === 429 && retryCount < MAX_RETRIES) {
				const delay = Math.pow(2, retryCount) * 1000;
				langStatuses.value[langCode] = { status: 'retrying' };
				await new Promise((resolve) => setTimeout(resolve, delay));

				if (!cancelled.value) {
					return translateLanguage(langCode, retryCount + 1);
				}

				return;
			}

			const errorMessage =
				error?.response?.data?.errors?.[0]?.message ?? error?.message ?? t('interfaces.translations.translation_error');

			langStatuses.value[langCode] = {
				status: 'error',
				error: errorMessage,
			};
		}
	}

	return {
		jobState,
		langStatuses,
		isTranslating,
		hasErrors,
		completedCount,
		translatedCount,
		totalCount,
		progressPercent,
		progressLabel,
		pendingLanguages,
		pendingFields,
		applyTranslatedFields: options.applyTranslatedFields,
		start,
		cancel,
		retry,
		reset,
	};
}

export type TranslationJob = ReturnType<typeof useTranslationJob>;
