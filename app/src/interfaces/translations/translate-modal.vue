<script setup lang="ts">
import type { Field } from '@directus/types';
import { useLocalStorage } from '@vueuse/core';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
	buildAiTranslationPrompt,
	getAiTranslationFieldDescription,
	normalizeAiTranslatedFields,
	resolveTranslationTargetPermission,
	type TranslationTargetPermissionReason,
} from './ai-translation';
import AiMagicButton from '@/ai/components/ai-magic-button.vue';
import AiModelSelector from '@/ai/components/ai-model-selector.vue';
import type { AppModelDefinition } from '@/ai/models';
import { useAiStore } from '@/ai/stores/use-ai';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VCheckbox from '@/components/v-checkbox.vue';
import VDrawer from '@/components/v-drawer.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VNotice from '@/components/v-notice.vue';
import VProgressLinear from '@/components/v-progress-linear.vue';
import VSelect from '@/components/v-select/v-select.vue';
import type { RelationM2M } from '@/composables/use-relation-m2m';
import type { DisplayItem } from '@/composables/use-relation-multiple';
import { usePermissionsStore } from '@/stores/permissions';
import { useSettingsStore } from '@/stores/settings';
import { useUserStore } from '@/stores/user';
import { unexpectedError } from '@/utils/unexpected-error';

const props = defineProps<{
	modelValue: boolean;
	languageOptions: Record<string, any>[];
	displayItems: DisplayItem[];
	fields: Field[];
	relationInfo?: RelationM2M;
	getItemWithLang: (items: Record<string, any>[], lang: string | undefined) => DisplayItem | undefined;
	applyTranslatedFields: (translatedFields: Record<string, string>, lang: string | undefined) => void;
	defaultSourceLanguage?: string;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
}>();

const { t } = useI18n();
const aiStore = useAiStore();
const permissionsStore = usePermissionsStore();
const settingsStore = useSettingsStore();
const userStore = useUserStore();

// State
type ModalState = 'config' | 'translating' | 'complete';
const modalState = ref<ModalState>('config');

type LangStatus = 'pending' | 'translating' | 'retrying' | 'done' | 'error';
const langStatuses = ref<Record<string, { status: LangStatus; fieldCount?: number; error?: string }>>({});

const targetPermissions = ref<
	Record<string, { allowed: boolean; loading: boolean; reason?: TranslationTargetPermissionReason }>
>({});

const permissionsLoaded = ref(false);
let permissionRequestId = 0;

const sourceLanguage = ref<string>(props.defaultSourceLanguage ?? props.languageOptions[0]?.value ?? '');
const selectedFields = ref<string[]>([]);
const selectedTargetLanguages = ref<string[]>([]);
const cancelled = ref(false);

// Model selection — separate from chat, persisted independently
const selectedModelId = useLocalStorage<string | null>('selected-ai-translation-model', null);

const selectedModel = computed<AppModelDefinition | null>(() => {
	if (!selectedModelId.value) return aiStore.models[0] ?? null;

	const colonIndex = selectedModelId.value.indexOf(':');
	if (colonIndex === -1) return aiStore.models[0] ?? null;

	const provider = selectedModelId.value.slice(0, colonIndex);
	const model = selectedModelId.value.slice(colonIndex + 1);

	return aiStore.models.find((m) => m.provider === provider && m.model === model) ?? aiStore.models[0] ?? null;
});

function onModelSelect(model: AppModelDefinition) {
	selectedModelId.value = `${model.provider}:${model.model}`;
}

// Translatable fields — string/text only, not hidden/readonly, not FK/PK
const translatableFields = computed(() => {
	if (!props.relationInfo) return [];

	const junctionField = props.relationInfo.junctionField.field;
	const reverseJunctionField = props.relationInfo.reverseJunctionField.field;
	const pkField = props.relationInfo.junctionPrimaryKeyField.field;

	const nonTranslatableInterfaces = new Set([
		'select-dropdown',
		'select-multiple-dropdown',
		'select-radio',
		'select-multiple-checkbox',
		'boolean',
		'datetime',
		'slider',
		'toggle',
		'file',
		'file-image',
		'files',
		'collection',
		'map',
		'color',
	]);

	return props.fields.filter((field) => {
		if (field.field === junctionField) return false;
		if (field.field === reverseJunctionField) return false;
		if (field.field === pkField) return false;
		if (field.type !== 'string' && field.type !== 'text') return false;
		if (field.type === 'alias') return false;
		if (field.meta?.hidden !== false) return false;
		if (field.meta?.readonly !== false) return false;
		if (field.meta?.interface && nonTranslatableInterfaces.has(field.meta.interface)) return false;
		return true;
	});
});

// Field labels for display
function getFieldLabel(field: Field): string {
	return field.name ?? field.field;
}

// Source content preview for a field
function getSourceFieldValue(fieldName: string): string | null {
	const item = props.getItemWithLang(props.displayItems, sourceLanguage.value);
	if (!item) return null;

	const val = item[fieldName];
	if (val === null || val === undefined || val === '') return null;

	return String(val);
}

function getTruncatedSourceValue(fieldName: string, maxLength = 60): string {
	const val = getSourceFieldValue(fieldName);
	if (!val) return '';

	if (val.length <= maxLength) return val;
	return val.slice(0, maxLength) + '…';
}

// Target languages — all except source
const targetLanguageOptions = computed(() =>
	props.languageOptions
		.filter((lang) => lang.value !== sourceLanguage.value)
		.sort((a, b) => {
			const aComplete = isLanguageComplete(a.value);
			const bComplete = isLanguageComplete(b.value);

			if (aComplete !== bComplete) return aComplete ? 1 : -1;
			return (a.text as string).localeCompare(b.text as string);
		}),
);

function isLanguageComplete(langCode: string): boolean {
	const item = props.getItemWithLang(props.displayItems, langCode);

	if (!item) return false;

	return selectedFields.value.every((fieldName) => {
		const val = item[fieldName];
		return val !== null && val !== undefined && val !== '';
	});
}

function getLanguageFieldProgress(langCode: string): { current: number; max: number } {
	const item = props.getItemWithLang(props.displayItems, langCode);
	const max = selectedFields.value.length;

	if (!item) return { current: 0, max };

	const current = selectedFields.value.filter((fieldName) => {
		const val = item[fieldName];
		return val !== null && val !== undefined && val !== '';
	}).length;

	return { current, max };
}

const permittedTargetLanguages = computed(() =>
	selectedTargetLanguages.value.filter((langCode) => targetPermissions.value[langCode]?.allowed === true),
);

const permissionsLoading = computed(() =>
	targetLanguageOptions.value.some((lang) => targetPermissions.value[lang.value]?.loading === true),
);

const translatableFieldsByName = computed(() => new Map(translatableFields.value.map((field) => [field.field, field])));

// Preselect fields with source content
function preselectFieldsFromSource() {
	const sourceItem = props.getItemWithLang(props.displayItems, sourceLanguage.value);

	selectedFields.value = translatableFields.value
		.filter((f) => {
			const val = sourceItem?.[f.field];
			return val !== null && val !== undefined && val !== '';
		})
		.map((f) => f.field);
}

// Initialize selections when drawer opens
watch(
	() => props.modelValue,
	(open) => {
		if (open) {
			modalState.value = 'config';
			langStatuses.value = {};
			cancelled.value = false;
			permissionsLoaded.value = false;
			targetPermissions.value = {};
			sourceLanguage.value = props.defaultSourceLanguage ?? props.languageOptions[0]?.value ?? '';
			preselectFieldsFromSource();

			// Pre-select incomplete languages
			selectedTargetLanguages.value = targetLanguageOptions.value
				.filter((lang) => !isLanguageComplete(lang.value))
				.map((lang) => lang.value);

			void loadTargetPermissions();
		} else {
			targetPermissions.value = {};
			permissionsLoaded.value = false;
		}
	},
);

watch(sourceLanguage, (newSource, oldSource) => {
	if (newSource === oldSource) return;

	// Re-run field preselection based on new source
	preselectFieldsFromSource();

	selectedTargetLanguages.value = selectedTargetLanguages.value.filter((lang) => lang !== newSource);

	if (props.modelValue) {
		void loadTargetPermissions();
	}
});

function getTargetPermissionReason(langCode: string): string | null {
	const reason = targetPermissions.value[langCode]?.reason;

	if (reason === 'pending-delete') {
		return t('interfaces.translations.translation_pending_delete');
	}

	if (reason === 'not-allowed') {
		return t('interfaces.translations.translation_not_allowed');
	}

	return null;
}

async function loadTargetPermissions() {
	if (!props.relationInfo) {
		targetPermissions.value = {};
		permissionsLoaded.value = true;
		return;
	}

	const requestId = ++permissionRequestId;
	const info = props.relationInfo;
	const collection = info.junctionCollection.collection;
	const updatePermissionAccess = permissionsStore.getPermission(collection, 'update')?.access ?? null;
	const hasCreatePermission = permissionsStore.hasPermission(collection, 'create');

	targetPermissions.value = Object.fromEntries(
		targetLanguageOptions.value.map((lang) => [
			lang.value,
			{
				allowed: false,
				loading: true,
			},
		]),
	);

	permissionsLoaded.value = false;

	const permissionEntries = await Promise.all(
		targetLanguageOptions.value.map(async (lang) => {
			const existing = props.getItemWithLang(props.displayItems, lang.value);
			const itemPrimaryKey = existing?.[info.junctionPrimaryKeyField.field];

			const permission = await resolveTranslationTargetPermission({
				isAdmin: userStore.isAdmin,
				isMarkedForDeletion: existing?.$type === 'deleted',
				itemPrimaryKey,
				hasCreatePermission,
				updatePermissionAccess,
				fetchItemUpdatePermission: async () => {
					if (itemPrimaryKey === undefined || itemPrimaryKey === null) {
						return false;
					}

					try {
						const response = await api.get<{ data: { update: { access: boolean } } }>(
							`/permissions/me/${collection}/${encodeURIComponent(itemPrimaryKey)}`,
						);

						return response.data.data.update.access;
					} catch (error) {
						unexpectedError(error);
						return true;
					}
				},
			});

			return [lang.value, { ...permission, loading: false }] as const;
		}),
	);

	if (requestId !== permissionRequestId) {
		return;
	}

	targetPermissions.value = Object.fromEntries(permissionEntries);
	permissionsLoaded.value = true;

	selectedTargetLanguages.value = selectedTargetLanguages.value.filter(
		(lang) => lang !== sourceLanguage.value && targetPermissions.value[lang]?.allowed === true,
	);
}

async function ensureTargetPermissionsLoaded() {
	if (!permissionsLoaded.value || permissionsLoading.value) {
		await loadTargetPermissions();
	}
}

// All/None toggles
function toggleAllFields() {
	if (selectedFields.value.length === translatableFields.value.length) {
		selectedFields.value = [];
	} else {
		selectedFields.value = translatableFields.value.map((f) => f.field);
	}
}

function toggleAllTargets() {
	const permitted = targetLanguageOptions.value
		.filter((lang) => targetPermissions.value[lang.value]?.allowed === true)
		.map((lang) => lang.value);

	if (selectedTargetLanguages.value.length === permitted.length) {
		selectedTargetLanguages.value = [];
	} else {
		selectedTargetLanguages.value = permitted;
	}
}

function toggleFieldSelection(fieldName: string, enabled: boolean) {
	if (enabled) {
		selectedFields.value = Array.from(new Set([...selectedFields.value, fieldName]));
		return;
	}

	selectedFields.value = selectedFields.value.filter((field) => field !== fieldName);
}

function toggleTargetSelection(langCode: string, enabled: boolean) {
	if (targetPermissions.value[langCode]?.allowed !== true) {
		return;
	}

	if (enabled) {
		selectedTargetLanguages.value = Array.from(new Set([...selectedTargetLanguages.value, langCode]));
		return;
	}

	selectedTargetLanguages.value = selectedTargetLanguages.value.filter((lang) => lang !== langCode);
}

// Source content for the prompt
const sourceContent = computed(() => {
	const item = props.getItemWithLang(props.displayItems, sourceLanguage.value);
	const content: Record<string, string> = {};

	if (!item) return content;

	for (const fieldName of selectedFields.value) {
		const val = item[fieldName];

		if (val !== null && val !== undefined && val !== '') {
			content[fieldName] = String(val);
		}
	}

	return content;
});

const hasSourceContent = computed(() => Object.keys(sourceContent.value).length > 0);

const selectedTargetCount = computed(() => selectedTargetLanguages.value.length);

const allFieldsSelected = computed(
	() => selectedFields.value.length === translatableFields.value.length && translatableFields.value.length > 0,
);

const allTargetsSelected = computed(() => {
	const permitted = targetLanguageOptions.value.filter((lang) => targetPermissions.value[lang.value]?.allowed === true);

	return selectedTargetLanguages.value.length === permitted.length && permitted.length > 0;
});

const canTranslate = computed(
	() =>
		hasSourceContent.value &&
		permittedTargetLanguages.value.length > 0 &&
		selectedFields.value.length > 0 &&
		selectedModel.value !== null &&
		permissionsLoaded.value &&
		!permissionsLoading.value,
);

// Translate — one call per language, all concurrent
const MAX_RETRIES = 3;

async function translate() {
	if (!selectedModel.value) return;

	await ensureTargetPermissionsLoaded();

	if (!canTranslate.value) return;

	modalState.value = 'translating';
	cancelled.value = false;

	const blockedTargets = selectedTargetLanguages.value.filter(
		(langCode) => targetPermissions.value[langCode]?.allowed !== true,
	);

	const allowedTargets = permittedTargetLanguages.value;

	for (const langCode of blockedTargets) {
		langStatuses.value[langCode] = {
			status: 'error',
			error: getTargetPermissionReason(langCode) ?? t('not_allowed'),
		};
	}

	if (allowedTargets.length === 0) {
		modalState.value = 'complete';
		return;
	}

	// Init statuses
	for (const langCode of allowedTargets) {
		langStatuses.value[langCode] = { status: 'pending' };
	}

	// Fire all concurrently
	await Promise.allSettled(allowedTargets.map((langCode) => translateLanguage(langCode)));

	if (!cancelled.value) {
		modalState.value = 'complete';
	}
}

async function translateLanguage(langCode: string, retryCount = 0): Promise<void> {
	if (cancelled.value) return;

	langStatuses.value[langCode] = { status: retryCount > 0 ? 'retrying' : 'translating' };

	const fieldsWithContent = Object.keys(sourceContent.value);

	const selectedFieldDefinitions = fieldsWithContent
		.map((fieldName) => translatableFieldsByName.value.get(fieldName))
		.filter((field): field is Field => field !== undefined);

	// Flat output schema — single language
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

	const langName = props.languageOptions.find((l) => l.value === langCode)?.text ?? langCode;

	const sourceLangName =
		props.languageOptions.find((l) => l.value === sourceLanguage.value)?.text ?? sourceLanguage.value;

	const prompt = buildAiTranslationPrompt({
		sourceLangName,
		targetLangNames: [langName],
		sourceContent: sourceContent.value,
		fields: selectedFieldDefinitions,
		styleGuide: settingsStore.settings?.ai_translation_style_guide,
		glossary: settingsStore.settings?.ai_translation_glossary,
	});

	try {
		const response = await api.post('/ai/object', {
			provider: selectedModel.value!.provider,
			model: selectedModel.value!.model,
			prompt,
			outputSchema,
		});

		if (cancelled.value) return;

		const translations = response.data.data;

		props.applyTranslatedFields(normalizeAiTranslatedFields(translations, selectedFieldDefinitions), langCode);

		langStatuses.value[langCode] = {
			status: 'done',
			fieldCount: Object.keys(translations).length,
		};
	} catch (error: any) {
		if (cancelled.value) return;

		const statusCode = error?.response?.status;

		// Rate limit — auto-retry with exponential backoff
		if (statusCode === 429 && retryCount < MAX_RETRIES) {
			const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
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

async function retryLanguage(langCode: string) {
	await ensureTargetPermissionsLoaded();

	if (targetPermissions.value[langCode]?.allowed !== true) {
		langStatuses.value[langCode] = {
			status: 'error',
			error: getTargetPermissionReason(langCode) ?? t('not_allowed'),
		};

		return;
	}

	await translateLanguage(langCode);

	// Check if all done after retry
	const allDone = Object.values(langStatuses.value).every((s) => s.status === 'done' || s.status === 'error');

	if (allDone && !Object.values(langStatuses.value).some((s) => s.status === 'error')) {
		modalState.value = 'complete';
	}
}

// Progress
const completedCount = computed(
	() => Object.values(langStatuses.value).filter((s) => s.status === 'done' || s.status === 'error').length,
);

const translatedCount = computed(() => Object.values(langStatuses.value).filter((s) => s.status === 'done').length);

const totalCount = computed(() => selectedTargetLanguages.value.length);

const progressPercent = computed(() =>
	totalCount.value > 0 ? Math.round((completedCount.value / totalCount.value) * 100) : 0,
);

// Close handling
function close() {
	if (modalState.value === 'translating') {
		cancelled.value = true;
	}

	emit('update:modelValue', false);
}
</script>

<template>
	<VDrawer
		:model-value="modelValue"
		icon="auto_awesome"
		:title="t('interfaces.translations.ai_translate')"
		:persistent="modalState === 'translating'"
		@update:model-value="$emit('update:modelValue', $event)"
		@cancel="close"
	>
		<template #title>
			<AiMagicButton :animate="modalState === 'translating'" />
			<span class="drawer-title">{{ t('interfaces.translations.ai_translate') }}</span>
		</template>

		<template v-if="aiStore.models.length > 1" #actions>
			<AiModelSelector :model-value="selectedModel" @update:model-value="onModelSelect" />
		</template>

		<div class="content">
			<!-- State 1: Configuration -->
			<template v-if="modalState === 'config'">
				<VNotice v-if="aiStore.models.length === 0" type="warning">
					{{ t('interfaces.translations.no_translation_models') }}
				</VNotice>

				<VNotice v-if="languageOptions.length <= 1" type="info">
					{{ t('interfaces.translations.no_additional_languages') }}
				</VNotice>

				<template v-else>
					<!-- Source Language -->
					<div class="section">
						<div class="section-header">
							<span class="section-title-label">{{ t('interfaces.translations.source_language') }}</span>
						</div>

						<VSelect v-model="sourceLanguage" :items="languageOptions" item-text="text" item-value="value" />
					</div>

					<!-- Fields to Translate -->
					<div class="section">
						<div class="section-header">
							<span class="section-title-label">{{ t('interfaces.translations.fields_to_translate') }}</span>
						</div>

						<div class="selection-panel">
							<div class="selection-content">
								<div
									v-for="field in translatableFields"
									:key="field.field"
									class="field-row"
									@click="toggleFieldSelection(field.field, !selectedFields.includes(field.field))"
								>
									<VCheckbox
										:model-value="selectedFields.includes(field.field)"
										@update:model-value="toggleFieldSelection(field.field, $event)"
										@click.stop
									/>

									<div class="field-info">
										<span class="field-label">{{ getFieldLabel(field) }}</span>
										<span v-if="getSourceFieldValue(field.field)" class="field-preview">
											{{ getTruncatedSourceValue(field.field) }}
										</span>
										<span v-else class="field-preview empty">{{ t('interfaces.translations.empty') }}</span>
									</div>
								</div>
							</div>

							<div class="selection-footer">
								<button class="toggle-link" @click="toggleAllFields">
									{{ allFieldsSelected ? t('deselect_all') : t('select_all') }}
								</button>
							</div>
						</div>
					</div>

					<!-- Target Languages -->
					<div class="section">
						<div class="section-header">
							<span class="section-title-label">
								{{ t('interfaces.translations.target_languages') }}
								({{ selectedTargetCount }}/{{ targetLanguageOptions.length }})
							</span>
						</div>

						<div class="selection-panel">
							<div class="selection-content">
								<div
									v-for="lang in targetLanguageOptions"
									:key="lang.value"
									class="language-row"
									@click="toggleTargetSelection(lang.value, !selectedTargetLanguages.includes(lang.value))"
								>
									<VCheckbox
										:model-value="selectedTargetLanguages.includes(lang.value)"
										:disabled="
											targetPermissions[lang.value]?.loading || targetPermissions[lang.value]?.allowed === false
										"
										@update:model-value="toggleTargetSelection(lang.value, $event)"
										@click.stop
									/>

									<span class="language-label">{{ lang.text }}</span>

									<div class="language-progress">
										<span class="progress-text">
											{{ getLanguageFieldProgress(lang.value).current }}/{{ getLanguageFieldProgress(lang.value).max }}
										</span>

										<VProgressLinear
											:value="
												getLanguageFieldProgress(lang.value).max > 0
													? (getLanguageFieldProgress(lang.value).current / getLanguageFieldProgress(lang.value).max) *
														100
													: 0
											"
											rounded
											colorful
										/>
									</div>

									<div v-if="targetPermissions[lang.value]?.allowed === false" class="permission-note">
										{{ getTargetPermissionReason(lang.value) }}
									</div>
								</div>
							</div>

							<div class="selection-footer">
								<button class="toggle-link" @click="toggleAllTargets">
									{{ allTargetsSelected ? t('deselect_all') : t('select_all') }}
								</button>
							</div>
						</div>
					</div>

					<!-- Empty source warning -->
					<VNotice v-if="!hasSourceContent && selectedFields.length > 0" type="warning">
						{{ t('interfaces.translations.no_source_content') }}
					</VNotice>

					<VButton class="translate-button" :disabled="!canTranslate" full-width @click="translate">
						{{ t('interfaces.translations.translate_n_languages', selectedTargetCount) }}
					</VButton>
				</template>
			</template>

			<!-- State 2: Translating -->
			<template v-if="modalState === 'translating'">
				<p class="translating-title">
					{{ t('interfaces.translations.translating_n_languages', selectedTargetCount) }}
				</p>

				<div class="status-list">
					<div v-for="langCode in selectedTargetLanguages" :key="langCode" class="status-row">
						<span class="status-lang">{{ languageOptions.find((l) => l.value === langCode)?.text ?? langCode }}</span>

						<template v-if="langStatuses[langCode]?.status === 'translating'">
							<span class="status-text translating">{{ t('loading') }}...</span>
							<VIcon name="progress_activity" class="spinning" small />
						</template>

						<template v-else-if="langStatuses[langCode]?.status === 'retrying'">
							<span class="status-text translating">{{ t('interfaces.translations.retrying') }}...</span>
							<VIcon name="progress_activity" class="spinning" small />
						</template>

						<template v-else-if="langStatuses[langCode]?.status === 'done'">
							<span class="status-text done">{{ t('done') }}</span>
							<VIcon name="check" class="done" small />
						</template>

						<template v-else-if="langStatuses[langCode]?.status === 'error'">
							<span class="status-text error">{{ langStatuses[langCode]?.error }}</span>
							<VButton x-small secondary @click="retryLanguage(langCode)">{{ t('retry') }}</VButton>
						</template>

						<template v-else>
							<span class="status-text pending">{{ t('interfaces.translations.pending') }}</span>
						</template>
					</div>
				</div>

				<VProgressLinear :value="progressPercent" rounded colorful />
				<p class="progress-label">{{ completedCount }}/{{ totalCount }} {{ t('done') }}</p>

				<VButton class="translate-button" secondary full-width @click="close">
					{{ t('cancel') }}
				</VButton>
			</template>

			<!-- State 3: Complete -->
			<template v-if="modalState === 'complete'">
				<div class="complete-header">
					<VIcon name="check_circle" class="complete-icon" />
					<span>{{ t('interfaces.translations.n_languages_translated', translatedCount) }}</span>
				</div>

				<div class="status-list">
					<div v-for="langCode in selectedTargetLanguages" :key="langCode" class="status-row">
						<span class="status-lang">{{ languageOptions.find((l) => l.value === langCode)?.text ?? langCode }}</span>

						<template v-if="langStatuses[langCode]?.status === 'done'">
							<VIcon name="check" class="done" small />
							<span class="status-text">
								{{ t('interfaces.translations.n_fields', langStatuses[langCode]?.fieldCount ?? 0) }}
							</span>
						</template>

						<template v-else-if="langStatuses[langCode]?.status === 'error'">
							<VIcon name="warning" class="error" small />
							<VButton x-small secondary @click="retryLanguage(langCode)">{{ t('retry') }}</VButton>
						</template>
					</div>
				</div>

				<VButton class="translate-button" full-width @click="close">
					{{ t('done') }}
				</VButton>
			</template>
		</div>
	</VDrawer>
</template>

<style lang="scss" scoped>
.drawer-title {
	font-weight: 600;
}

.content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}

.section {
	& + .section {
		margin-block-start: 1.5rem;
	}
}

.section-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-block-end: 0.5rem;
}

.section-title-label {
	font-weight: 600;
	font-size: 0.875rem;
}

.selection-panel {
	border: var(--theme--border-width) solid var(--theme--border-color);
	border-radius: var(--theme--border-radius);
	overflow: hidden;
}

.selection-content {
	display: flex;
	flex-direction: column;
	max-block-size: 15.75rem;
	overflow-y: auto;
	padding: 0.25rem 0;
}

.selection-footer {
	display: flex;
	justify-content: flex-end;
	padding: 0.5rem;
	border-block-start: var(--theme--border-width) solid var(--theme--border-color);
	background: var(--theme--background-subdued);
	position: sticky;
	inset-block-end: 0;
}

.toggle-link {
	background: none;
	border: none;
	color: var(--theme--primary);
	cursor: pointer;
	font-size: 0.75rem;
	padding: 0;

	&:hover {
		text-decoration: underline;
	}
}

.field-row {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.375rem 0.75rem;
	cursor: pointer;

	&:hover {
		background: var(--theme--background-accent);
	}
}

.field-info {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	flex: 1;
	min-inline-size: 0;
}

.field-label {
	font-size: 0.875rem;
	white-space: nowrap;
}

.field-preview {
	font-size: 0.75rem;
	color: var(--theme--foreground-subdued);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	min-inline-size: 0;

	&.empty {
		font-style: italic;
	}
}

.language-row {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.375rem 0.75rem;
	flex-wrap: wrap;
	row-gap: 0.25rem;
	cursor: pointer;

	&:hover {
		background: var(--theme--background-accent);
	}
}

.language-label {
	font-size: 0.875rem;
	flex: 1;
}

.language-progress {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	min-inline-size: 7.5rem;
}

.progress-text {
	font-size: 0.75rem;
	color: var(--theme--foreground-subdued);
	white-space: nowrap;
}

.v-progress-linear {
	max-inline-size: 5rem;
}

.permission-note {
	flex-basis: 100%;
	font-size: 0.75rem;
	color: var(--theme--danger);
	padding-inline-start: 1.75rem;
}

.translate-button {
	margin-block-start: 1.5rem;
}

.translating-title {
	font-weight: 600;
	margin-block-end: 1rem;
}

.status-list {
	margin-block-end: 1rem;
}

.status-row {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding-block: 0.375rem;
}

.status-lang {
	flex: 1;
	font-size: 0.875rem;
}

.status-text {
	font-size: 0.75rem;
	color: var(--theme--foreground-subdued);

	&.done {
		color: var(--theme--success);
	}

	&.error {
		color: var(--theme--danger);
	}

	&.translating {
		color: var(--theme--primary);
	}
}

.v-icon {
	&.done {
		--v-icon-color: var(--theme--success);
	}

	&.error {
		--v-icon-color: var(--theme--danger);
	}

	&.spinning {
		animation: spin 1s linear infinite;
	}
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}

	to {
		transform: rotate(360deg);
	}
}

.progress-label {
	text-align: center;
	font-size: 0.75rem;
	color: var(--theme--foreground-subdued);
	margin-block-start: 0.5rem;
}

.complete-header {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 600;
	margin-block-end: 1rem;
}

.complete-icon {
	--v-icon-color: var(--theme--success);
}
</style>
