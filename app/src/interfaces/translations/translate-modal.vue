<script setup lang="ts">
import type { Field } from '@directus/types';
import { useLocalStorage } from '@vueuse/core';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { resolveTranslationTargetPermission, type TranslationTargetPermissionReason } from './ai-translation';
import type { TranslationJob } from './use-translation-job';
import type { AppModelDefinition } from '@/ai/models';
import { useAiStore } from '@/ai/stores/use-ai';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VCheckbox from '@/components/v-checkbox.vue';
import VChip from '@/components/v-chip.vue';
import VDivider from '@/components/v-divider.vue';
import VDrawer from '@/components/v-drawer.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VNotice from '@/components/v-notice.vue';
import VProgressLinear from '@/components/v-progress-linear.vue';
import VSelect from '@/components/v-select/v-select.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import type { RelationM2M } from '@/composables/use-relation-m2m';
import type { DisplayItem } from '@/composables/use-relation-multiple';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { unexpectedError } from '@/utils/unexpected-error';

const props = defineProps<{
	modelValue: boolean;
	languageOptions: Record<string, any>[];
	displayItems: DisplayItem[];
	fields: Field[];
	relationInfo?: RelationM2M;
	getItemWithLang: (items: Record<string, any>[], lang: string | undefined) => DisplayItem | undefined;
	defaultSourceLanguage?: string;
	translationJob: TranslationJob;
}>();

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void;
}>();

const { t } = useI18n();
const aiStore = useAiStore();
const permissionsStore = usePermissionsStore();
const userStore = useUserStore();

// Local UI state — whether the user is viewing config vs progress/completion
const showingConfig = ref(true);

type ModalState = 'config' | 'translating' | 'complete';

const modalState = computed<ModalState>(() => {
	const job = props.translationJob;

	if (job.jobState.value === 'translating') return 'translating';
	if (job.jobState.value === 'complete' && !showingConfig.value) return 'complete';
	return 'config';
});

const targetPermissions = ref<
	Record<string, { allowed: boolean; loading: boolean; reason?: TranslationTargetPermissionReason }>
>({});

const permissionsLoaded = ref(false);
let permissionRequestId = 0;

const sourceLanguage = ref<string>(props.defaultSourceLanguage ?? props.languageOptions[0]?.value ?? '');
const selectedFields = ref<string[]>([]);
const selectedTargetLanguages = ref<string[]>([]);

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

const modelSelectorActive = ref(false);
const modelSearch = ref('');

const shouldShowModelSelector = computed(() => aiStore.models.length > 1);

const shouldShowModelSearch = computed(() => aiStore.models.length > 10 || modelSearch.value.length > 0);

const visibleModels = computed(() => {
	const searchTerm = modelSearch.value.trim().toLowerCase();

	if (!searchTerm) return aiStore.models;

	return aiStore.models.filter((model) =>
		[model.name, model.model, model.provider].some((value) => value.toLowerCase().includes(searchTerm)),
	);
});

watch(modelSelectorActive, (active) => {
	if (!active) {
		modelSearch.value = '';
	}
});

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
	const progress = languageFieldProgress.value[langCode];
	if (!progress) return false;
	return progress.current === progress.max && progress.max > 0;
}

const languageFieldProgress = computed(() => {
	const result: Record<string, { current: number; max: number }> = {};
	const max = selectedFields.value.length;

	for (const lang of targetLanguageOptions.value) {
		const item = props.getItemWithLang(props.displayItems, lang.value);

		if (!item) {
			result[lang.value] = { current: 0, max };
			continue;
		}

		const current = selectedFields.value.filter((fieldName) => {
			const val = item[fieldName];
			return val !== null && val !== undefined && val !== '';
		}).length;

		result[lang.value] = { current, max };
	}

	return result;
});

const permittedTargetLanguages = computed(() =>
	selectedTargetLanguages.value.filter((langCode) => targetPermissions.value[langCode]?.allowed === true),
);

const permissionsLoading = computed(() =>
	targetLanguageOptions.value.some((lang) => targetPermissions.value[lang.value]?.loading === true),
);

const translatableFieldsByName = computed(() => new Map(translatableFields.value.map((field) => [field.field, field])));

const languageOptionsByCode = computed(() => new Map(props.languageOptions.map((lang) => [lang.value, lang])));

const emptySourceFields = computed(() => {
	const empty = new Set<string>();

	for (const field of translatableFields.value) {
		if (!getSourceFieldValue(field.field)) {
			empty.add(field.field);
		}
	}

	return empty;
});

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
			const job = props.translationJob;

			// If a job is running or complete, show progress/completion
			if (job.jobState.value === 'translating' || job.jobState.value === 'complete') {
				showingConfig.value = false;
				return;
			}

			// Fresh config
			showingConfig.value = true;
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

// Select/Deselect
function selectAllFields() {
	selectedFields.value = translatableFields.value
		.filter((f) => !emptySourceFields.value.has(f.field))
		.map((f) => f.field);
}

function deselectAllFields() {
	selectedFields.value = [];
}

function selectAllTargets() {
	selectedTargetLanguages.value = targetLanguageOptions.value
		.filter((lang) => targetPermissions.value[lang.value]?.allowed === true)
		.map((lang) => lang.value);
}

function deselectAllTargets() {
	selectedTargetLanguages.value = [];
}

function toggleFieldSelection(fieldName: string, enabled: boolean) {
	if (emptySourceFields.value.has(fieldName)) return;

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

const selectableFieldCount = computed(() => translatableFields.value.length - emptySourceFields.value.size);

const allFieldsSelected = computed(
	() => selectedFields.value.length === selectableFieldCount.value && selectableFieldCount.value > 0,
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

// Translate — delegate to composable
async function translate() {
	if (!selectedModel.value) return;

	await ensureTargetPermissionsLoaded();

	if (!canTranslate.value) return;

	const job = props.translationJob;

	// Handle blocked targets — set error in job's langStatuses before starting
	const blockedTargets = selectedTargetLanguages.value.filter(
		(langCode) => targetPermissions.value[langCode]?.allowed !== true,
	);

	const allowedTargets = permittedTargetLanguages.value;

	if (allowedTargets.length === 0) {
		return;
	}

	// Build field definitions for the snapshot
	const fieldsWithContent = Object.keys(sourceContent.value);

	const fieldDefinitions = fieldsWithContent
		.map((fieldName) => translatableFieldsByName.value.get(fieldName))
		.filter((field): field is Field => field !== undefined);

	showingConfig.value = false;

	job.start({
		sourceLanguage: sourceLanguage.value,
		selectedFields: [...selectedFields.value],
		targetLanguages: allowedTargets,
		model: selectedModel.value,
		sourceContent: { ...sourceContent.value },
		fieldDefinitions,
	});

	// Set blocked targets as errors after start
	for (const langCode of blockedTargets) {
		job.langStatuses.value[langCode] = {
			status: 'error',
			error: getTargetPermissionReason(langCode) ?? t('not_allowed'),
		};
	}

	// Auto-close drawer — translations continue in the background
	close();
}

async function retryLanguage(langCode: string) {
	await ensureTargetPermissionsLoaded();

	if (targetPermissions.value[langCode]?.allowed !== true) {
		const { langStatuses } = props.translationJob;

		langStatuses.value[langCode] = {
			status: 'error',
			error: getTargetPermissionReason(langCode) ?? t('not_allowed'),
		};

		return;
	}

	await props.translationJob.retry(langCode);
}

function showNewTranslation() {
	props.translationJob.reset();
	showingConfig.value = true;
	permissionsLoaded.value = false;
	targetPermissions.value = {};
	sourceLanguage.value = props.defaultSourceLanguage ?? props.languageOptions[0]?.value ?? '';
	preselectFieldsFromSource();

	selectedTargetLanguages.value = targetLanguageOptions.value
		.filter((lang) => !isLanguageComplete(lang.value))
		.map((lang) => lang.value);

	void loadTargetPermissions();
}

// Close — no longer cancels
function close() {
	emit('update:modelValue', false);
}

function cancelJob() {
	props.translationJob.cancel();
	emit('update:modelValue', false);
}

// Read progress from the job
const job = computed(() => props.translationJob);

const errorLanguages = computed(() =>
	Object.entries(job.value.langStatuses.value)
		.filter(([, entry]) => entry.status === 'error')
		.map(([langCode]) => langCode),
);

function langChipStyle(status: string | undefined) {
	switch (status) {
		case 'done':
			return {
				'--v-chip-color': 'var(--theme--success)',
				'--v-chip-background-color': 'var(--theme--success-background)',
			};
		case 'error':
			return {
				'--v-chip-color': 'var(--theme--danger)',
				'--v-chip-background-color': 'var(--theme--danger-background)',
			};
		case 'translating':
		case 'retrying':
			return {
				'--v-chip-color': 'var(--theme--primary)',
				'--v-chip-background-color': 'var(--theme--primary-background)',
			};
		default:
			return {
				'--v-chip-color': 'var(--theme--foreground-subdued)',
				'--v-chip-background-color': 'var(--theme--background-normal)',
			};
	}
}

function langStatusIcon(status: string | undefined) {
	switch (status) {
		case 'done':
			return 'check';
		case 'error':
			return 'error';
		case 'translating':
		case 'retrying':
			return 'progress_activity';
		default:
			return 'circle';
	}
}

function isActiveStatus(status: string | undefined) {
	return status === 'translating' || status === 'retrying';
}
</script>

<template>
	<VDrawer
		:model-value="modelValue"
		icon="auto_awesome"
		:title="t('interfaces.translations.ai_translate')"
		@update:model-value="$emit('update:modelValue', $event)"
		@cancel="close"
	>
		<template #title>
			<span class="drawer-title">{{ t('interfaces.translations.ai_translate') }}</span>
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
					<div class="section">
						<div class="field-grid" :class="{ 'has-two-columns': shouldShowModelSelector }">
							<div class="field-group">
								<div class="section-header">
									<span class="section-title-label">{{ t('interfaces.translations.source_language') }}</span>
								</div>

								<VSelect v-model="sourceLanguage" :items="languageOptions" item-text="text" item-value="value" />
							</div>

							<div v-if="shouldShowModelSelector" class="field-group">
								<div class="section-header">
									<span class="section-title-label">{{ t('interfaces.translations.model') }}</span>
								</div>

								<VMenu v-model="modelSelectorActive" placement="bottom-start">
									<template #activator="{ toggle, active }">
										<VInput
											class="model-field-input"
											:model-value="selectedModel?.name ?? ''"
											full-width
											readonly
											clickable
											:active="active"
											@click="toggle"
											@keydown:enter="toggle"
											@keydown:space="toggle"
										>
											<template #prepend>
												<component :is="selectedModel?.icon" v-if="selectedModel?.icon" class="model-icon" />
											</template>

											<template #append>
												<VIcon name="expand_more" :class="{ active }" />
											</template>
										</VInput>
									</template>

									<VList class="model-list">
										<VListItem v-if="shouldShowModelSearch">
											<VListItemContent>
												<VInput v-model="modelSearch" autofocus small :placeholder="$t('search')" @click.stop.prevent>
													<template #append>
														<VIcon small name="search" />
													</template>
												</VInput>
											</VListItemContent>
										</VListItem>

										<VListItem v-if="visibleModels.length === 0">
											<VListItemContent>
												{{ $t('no_options_available') }}
											</VListItemContent>
										</VListItem>

										<template
											v-for="(modelDefinition, index) in visibleModels"
											:key="`${modelDefinition.provider}:${modelDefinition.model}`"
										>
											<VDivider v-if="index !== 0 && modelDefinition.provider !== visibleModels[index - 1]?.provider" />

											<VListItem
												:active="
													selectedModel?.provider === modelDefinition.provider &&
													selectedModel?.model === modelDefinition.model
												"
												clickable
												@click="onModelSelect(modelDefinition)"
											>
												<VListItemIcon>
													<component :is="modelDefinition.icon" v-if="modelDefinition.icon" class="model-icon" />
												</VListItemIcon>
												<VListItemContent>
													<div class="model-list-item-content">
														<VTextOverflow :text="modelDefinition.name" />
													</div>
												</VListItemContent>
											</VListItem>
										</template>
									</VList>
								</VMenu>
							</div>
						</div>
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
									v-tooltip="
										emptySourceFields.has(field.field) ? t('interfaces.translations.field_empty_tooltip') : undefined
									"
									class="field-row"
									:class="{ disabled: emptySourceFields.has(field.field) }"
									@click="toggleFieldSelection(field.field, !selectedFields.includes(field.field))"
								>
									<VCheckbox
										:model-value="selectedFields.includes(field.field)"
										:disabled="emptySourceFields.has(field.field)"
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
								<button type="button" :disabled="allFieldsSelected" @click="selectAllFields">
									{{ t('select_all') }}
								</button>
								/
								<button type="button" :disabled="selectedFields.length === 0" @click="deselectAllFields">
									{{ t('deselect_all') }}
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
											{{ languageFieldProgress[lang.value]?.current ?? 0 }}/{{
												languageFieldProgress[lang.value]?.max ?? 0
											}}
										</span>

										<VProgressLinear
											:value="
												(languageFieldProgress[lang.value]?.max ?? 0) > 0
													? ((languageFieldProgress[lang.value]?.current ?? 0) /
															(languageFieldProgress[lang.value]?.max ?? 1)) *
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
								<button type="button" :disabled="allTargetsSelected" @click="selectAllTargets">
									{{ t('select_all') }}
								</button>
								/
								<button type="button" :disabled="selectedTargetLanguages.length === 0" @click="deselectAllTargets">
									{{ t('deselect_all') }}
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
					{{
						t('interfaces.translations.ai_translating_progress', {
							done: job.completedCount.value,
							total: job.totalCount.value,
						})
					}}
				</p>

				<div class="lang-chip-grid">
					<VChip
						v-for="langCode in Object.keys(job.langStatuses.value)"
						:key="langCode"
						small
						disabled
						:style="langChipStyle(job.langStatuses.value[langCode]?.status)"
					>
						<VIcon
							:name="langStatusIcon(job.langStatuses.value[langCode]?.status)"
							x-small
							left
							:class="{ spinning: isActiveStatus(job.langStatuses.value[langCode]?.status) }"
						/>
						{{ languageOptionsByCode.get(langCode)?.text ?? langCode }}
					</VChip>
				</div>

				<VNotice v-for="langCode in errorLanguages" :key="'err-' + langCode" type="danger" class="error-notice">
					<div class="error-notice-content">
						<span>
							{{ languageOptionsByCode.get(langCode)?.text }}:
							{{ job.langStatuses.value[langCode]?.error }}
						</span>
						<VButton x-small secondary @click="retryLanguage(langCode)">{{ t('retry') }}</VButton>
					</div>
				</VNotice>

				<VButton class="translate-button" secondary full-width @click="cancelJob">
					{{ t('cancel') }}
				</VButton>
			</template>

			<!-- State 3: Complete -->
			<template v-if="modalState === 'complete'">
				<VNotice :type="job.hasErrors.value ? 'warning' : 'success'" class="complete-notice">
					{{ t('interfaces.translations.n_languages_translated', job.translatedCount.value) }}
				</VNotice>

				<div class="lang-chip-grid">
					<VChip
						v-for="langCode in Object.keys(job.langStatuses.value)"
						:key="langCode"
						small
						disabled
						:style="langChipStyle(job.langStatuses.value[langCode]?.status)"
					>
						<VIcon :name="langStatusIcon(job.langStatuses.value[langCode]?.status)" x-small left />
						{{ languageOptionsByCode.get(langCode)?.text ?? langCode }}
					</VChip>
				</div>

				<VNotice v-for="langCode in errorLanguages" :key="'err-' + langCode" type="danger" class="error-notice">
					<div class="error-notice-content">
						<span>
							{{ languageOptionsByCode.get(langCode)?.text }}:
							{{ job.langStatuses.value[langCode]?.error }}
						</span>
						<VButton x-small secondary @click="retryLanguage(langCode)">{{ t('retry') }}</VButton>
					</div>
				</VNotice>

				<div class="complete-actions">
					<VButton secondary full-width @click="showNewTranslation">
						{{ t('interfaces.translations.new_translation') }}
					</VButton>

					<VButton full-width @click="close">
						{{ t('done') }}
					</VButton>
				</div>
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

.field-grid {
	display: grid;
	gap: 1rem;
}

.field-grid.has-two-columns {
	grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field-group {
	min-inline-size: 0;
}

.model-list {
	inline-size: min(22rem, calc(100vw - 4rem));
}

.model-field-input :deep(.prepend) {
	display: flex;
	align-items: center;
}

.model-icon {
	display: block;
	inline-size: 0.875rem;
	block-size: 0.875rem;
	flex-shrink: 0;
}

.model-list-item-content {
	display: flex;
	align-items: center;
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
	padding: 0.5rem;
}

.selection-footer {
	position: sticky;
	inset-inline-end: 0;
	inset-block-end: 0;
	float: inline-end;
	inline-size: max-content;
	padding: 0.25rem 0.4375rem;
	text-align: end;
	color: var(--theme--foreground-subdued);
	background-color: var(--theme--background);
	border-start-start-radius: var(--theme--border-radius);

	button {
		color: var(--theme--foreground-subdued);
		cursor: pointer;
		transition: color var(--fast) var(--transition);
	}

	button:hover:not(:disabled) {
		color: var(--theme--foreground);
	}

	button:disabled {
		color: var(--theme--foreground-subdued);
		cursor: not-allowed;
		opacity: 0.5;
	}
}

.field-row {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.375rem 0.5rem;
	border-radius: var(--theme--border-radius);
	cursor: pointer;

	&:hover:not(.disabled) {
		background-color: var(--theme--background-normal);
	}

	&.disabled {
		opacity: 0.5;
		cursor: not-allowed;
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
	padding: 0.375rem 0.5rem;
	border-radius: var(--theme--border-radius);
	flex-wrap: wrap;
	row-gap: 0.25rem;
	cursor: pointer;

	&:hover {
		background-color: var(--theme--background-normal);
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

.lang-chip-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin-block-end: 1rem;
}

.spinning {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}

	to {
		transform: rotate(360deg);
	}
}

.error-notice {
	margin-block-end: 0.5rem;
}

.error-notice-content {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	inline-size: 100%;
}

.complete-notice {
	margin-block-end: 1rem;
}

.complete-actions {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-block-start: 1.5rem;
}

@media (width <= 640px) {
	.field-grid.has-two-columns {
		grid-template-columns: minmax(0, 1fr);
	}
}
</style>
