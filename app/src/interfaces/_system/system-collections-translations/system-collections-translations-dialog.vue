<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TranslationConfig } from './utils';
import { isFieldEligibleForTranslations } from './utils';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VCheckbox from '@/components/v-checkbox.vue';
import VDrawer from '@/components/v-drawer.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VNotice from '@/components/v-notice.vue';
import VSelect from '@/components/v-select/v-select.vue';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { unexpectedError } from '@/utils/unexpected-error';

const props = withDefaults(
	defineProps<{
		collection: string;
		mode?: 'enable' | 'manage';
		config?: TranslationConfig | null;
	}>(),
	{
		mode: 'enable',
		config: null,
	},
);

const { t } = useI18n();

const active = defineModel<boolean>('active', { default: false });

const collectionsStore = useCollectionsStore();
const fieldsStore = useFieldsStore();
const relationsStore = useRelationsStore();

const submitting = ref(false);
const showAdvancedMode = ref(false);
const autoFillNames = ref(true);
const selectedFields = ref<string[]>([]);
const translationsCollectionName = ref(`${props.collection}_translations`);
const languagesCollection = ref('languages');
const parentForeignKeyField = ref('');
const languageForeignKeyField = ref('');

const collectionFields = computed(() => fieldsStore.getFieldsForCollection(props.collection));
const primaryKeyField = computed(() => fieldsStore.getPrimaryKeyFieldForCollection(props.collection));
const isManageMode = computed(() => props.mode === 'manage');
const drawerTitle = computed(() => (isManageMode.value ? t('manage_translation_fields') : t('enable_translations')));

const availableFields = computed(() => {
	return collectionFields.value.filter((field) =>
		isFieldEligibleForTranslations(field, primaryKeyField.value?.field ?? null),
	);
});

const languagesCollectionExists = computed(() => {
	if (!languagesCollection.value) return false;
	return collectionsStore.getCollection(languagesCollection.value) !== null;
});

const languagesCollectionOptions = computed(() => {
	return collectionsStore.collections
		.map((collection) => ({
			text: collection.collection,
			value: collection.collection,
		}))
		.sort((a, b) => a.text.localeCompare(b.text));
});

const translationsCollectionExists = computed(() => {
	if (isManageMode.value) return false;
	const value = translationsCollectionName.value.trim();
	if (!value) return false;
	return collectionsStore.getCollection(value) !== null;
});

const manageConfigValid = computed(() => isManageMode.value && props.config?.valid === true);
const manageTargetCollection = computed(() => props.config?.translationsCollection ?? '');

const manageTranslationFields = computed(() =>
	manageTargetCollection.value ? fieldsStore.getFieldsForCollection(manageTargetCollection.value) : [],
);

const existingManageFieldNames = computed(() => {
	if (!props.config) return new Set<string>();

	const excluded = new Set(['id', props.config.parentForeignKeyField, props.config.languageForeignKeyField]);

	return new Set(
		manageTranslationFields.value.filter((field) => excluded.has(field.field) === false).map((field) => field.field),
	);
});

const missingManageFields = computed(() =>
	availableFields.value.filter((field) => existingManageFieldNames.value.has(field.field) === false),
);

const targetFields = computed(() => (isManageMode.value ? missingManageFields.value : availableFields.value));

const targetFieldOptions = computed(() =>
	targetFields.value.map((field) => ({
		field: field.field,
		name: field.name ?? field.field,
	})),
);

const isAllSelected = computed(() => {
	return targetFieldOptions.value.length > 0 && selectedFields.value.length === targetFieldOptions.value.length;
});

const parentPrimaryKey = computed(() => primaryKeyField.value?.field ?? 'id');

const languageCollectionName = computed(() => {
	if (isManageMode.value && props.config?.languagesCollection) return props.config.languagesCollection;
	return languagesCollection.value.trim();
});

const languagePrimaryKey = computed(() => {
	const languagesPrimaryKey = languageCollectionName.value
		? fieldsStore.getPrimaryKeyFieldForCollection(languageCollectionName.value)
		: null;

	return languagesPrimaryKey?.field ?? 'code';
});

const automaticParentForeignKeyField = computed(() => {
	if (isManageMode.value && props.config?.parentForeignKeyField) return props.config.parentForeignKeyField;
	return `${props.collection}_${parentPrimaryKey.value}`;
});

const automaticLanguageForeignKeyField = computed(() => {
	if (isManageMode.value && props.config?.languageForeignKeyField) return props.config.languageForeignKeyField;

	const languages = languageCollectionName.value || 'languages';
	return `${languages}_${languagePrimaryKey.value}`;
});

const resolvedParentForeignKeyField = computed(() => {
	if (isManageMode.value) return props.config?.parentForeignKeyField ?? '';
	if (autoFillNames.value) return automaticParentForeignKeyField.value;
	return parentForeignKeyField.value.trim();
});

const resolvedLanguageForeignKeyField = computed(() => {
	if (isManageMode.value) return props.config?.languageForeignKeyField ?? '';
	if (autoFillNames.value) return automaticLanguageForeignKeyField.value;
	return languageForeignKeyField.value.trim();
});

const fieldNameValidationMessage = computed(() => {
	if (isManageMode.value) return null;

	if (!resolvedParentForeignKeyField.value || !resolvedLanguageForeignKeyField.value) {
		return t('translations_field_name_required');
	}

	if (resolvedParentForeignKeyField.value === resolvedLanguageForeignKeyField.value) {
		return t('translations_foreign_key_name_conflict');
	}

	const allTargetNames = [
		'id',
		resolvedParentForeignKeyField.value,
		resolvedLanguageForeignKeyField.value,
		...selectedFields.value,
	];

	const duplicates = new Set<string>();

	for (const fieldName of allTargetNames) {
		if (allTargetNames.indexOf(fieldName) !== allTargetNames.lastIndexOf(fieldName)) {
			duplicates.add(fieldName);
		}
	}

	if (duplicates.size > 0) return t('translations_duplicate_field_names');

	return null;
});

const previewCollections = computed(() => {
	if (isManageMode.value) return [];

	const result = [translationsCollectionName.value.trim()].filter(Boolean);

	if (!languagesCollectionExists.value && languagesCollection.value.trim()) {
		result.push(languagesCollection.value.trim());
	}

	return result;
});

const previewFields = computed(() => {
	if (isManageMode.value) {
		return selectedFields.value;
	}

	const translationsCollection = translationsCollectionName.value.trim();

	const fields = [
		`${translationsCollection}.id`,
		`${translationsCollection}.${resolvedParentForeignKeyField.value}`,
		`${translationsCollection}.${resolvedLanguageForeignKeyField.value}`,
		...selectedFields.value.map((field) => `${translationsCollection}.${field}`),
		`${props.collection}.translations`,
	];

	return fields.filter((field) => field.includes('..') === false);
});

const previewRelations = computed(() => {
	if (isManageMode.value) return [];

	const translationsCollection = translationsCollectionName.value.trim();
	const languages = languagesCollection.value.trim();

	return [
		`${translationsCollection}.${resolvedParentForeignKeyField.value} -> ${props.collection}`,
		`${translationsCollection}.${resolvedLanguageForeignKeyField.value} -> ${languages}`,
	].filter((entry) => entry.includes('..') === false);
});

const canSubmit = computed(() => {
	if (isManageMode.value) {
		return manageConfigValid.value && selectedFields.value.length > 0;
	}

	return (
		selectedFields.value.length > 0 &&
		translationsCollectionName.value.trim().length > 0 &&
		languagesCollection.value.trim().length > 0 &&
		translationsCollectionExists.value === false &&
		fieldNameValidationMessage.value === null
	);
});

watch(
	() => props.collection,
	(collection) => {
		translationsCollectionName.value = `${collection}_translations`;
	},
	{ immediate: true },
);

watch(
	targetFields,
	(fields) => {
		selectedFields.value = fields.map((field) => field.field);
	},
	{ immediate: true },
);

watch(
	() => props.config,
	(config) => {
		if (!config || props.mode !== 'manage') return;

		translationsCollectionName.value = config.translationsCollection;
		languagesCollection.value = config.languagesCollection ?? 'languages';
		parentForeignKeyField.value = config.parentForeignKeyField;
		languageForeignKeyField.value = config.languageForeignKeyField;
	},
	{ immediate: true },
);

watch(active, (isActive) => {
	if (!isActive) return;

	showAdvancedMode.value = false;
	if (!isManageMode.value) autoFillNames.value = true;
});

watch(translationsCollectionExists, (exists) => {
	if (exists) showAdvancedMode.value = true;
});

watch(
	[automaticParentForeignKeyField, automaticLanguageForeignKeyField, autoFillNames],
	([nextParentForeignKey, nextLanguageForeignKey, nextAutoFill]) => {
		if (!nextAutoFill) return;

		parentForeignKeyField.value = nextParentForeignKey;
		languageForeignKeyField.value = nextLanguageForeignKey;
	},
	{ immediate: true },
);

function selectAllFields() {
	selectedFields.value = targetFields.value.map((field) => field.field);
}

function deselectAllFields() {
	selectedFields.value = [];
}

async function submitTranslations() {
	if (!canSubmit.value) return;

	if (isManageMode.value) {
		await api.post('/utils/translations/generate', {
			collection: props.collection,
			translationsCollection: manageTargetCollection.value,
			fields: selectedFields.value,
		});
		return;
	}

	await api.post('/utils/translations/generate', {
		collection: props.collection,
		fields: selectedFields.value,
		translationsCollection: translationsCollectionName.value.trim(),
		languagesCollection: languagesCollection.value.trim(),
		parentFkField: resolvedParentForeignKeyField.value,
		languageFkField: resolvedLanguageForeignKeyField.value,
		createLanguagesCollection: !languagesCollectionExists.value,
		seedLanguages: !languagesCollectionExists.value,
	});
}

async function submit() {
	if (!canSubmit.value) return;

	submitting.value = true;

	try {
		await submitTranslations();
	} catch (error) {
		unexpectedError(error);
		submitting.value = false;
		return;
	}

	// Best-effort post-processing — server changes already committed
	let postProcessingError: unknown = null;

	try {
		await fieldsStore.updateFields(
			props.collection,
			selectedFields.value.map((field) => ({
				field,
				meta: {
					hidden: true,
					readonly: true,
				},
			})),
		);
	} catch (error) {
		postProcessingError = error;
	}

	try {
		await Promise.all([collectionsStore.hydrate(), fieldsStore.hydrate(), relationsStore.hydrate()]);
	} catch (error) {
		postProcessingError ||= error;
	}

	if (postProcessingError) {
		unexpectedError(postProcessingError);
	}

	active.value = false;
	submitting.value = false;
}
</script>

<template>
	<VDrawer v-model="active" :title="drawerTitle" icon="translate" @cancel="active = false">
		<div class="content">
			<section class="section">
				<div class="label type-label section-title-label">
					{{ isManageMode ? $t('fields_to_add_to_translations') : $t('fields_to_translate') }}
				</div>

				<VNotice v-if="targetFieldOptions.length === 0" type="info">
					{{ isManageMode ? $t('translations_fields_up_to_date') : $t('no_fields_in_collection', { collection }) }}
				</VNotice>

				<div v-else class="selection-panel">
					<div class="selection-content">
						<VCheckbox
							v-for="field in targetFieldOptions"
							:key="field.field"
							:value="field.field"
							:label="field.name"
							v-model="selectedFields"
						/>
					</div>
					<div class="selection-footer">
						<button type="button" :disabled="isAllSelected" @click="selectAllFields">{{ $t('select_all') }}</button>
						/
						<button type="button" :disabled="selectedFields.length === 0" @click="deselectAllFields">
							{{ $t('deselect_all') }}
						</button>
					</div>
				</div>
			</section>

			<button type="button" class="toggle-advanced" @click="showAdvancedMode = !showAdvancedMode">
				{{ showAdvancedMode ? $t('hide_advanced_options') : $t('show_advanced_options') }}
			</button>

			<VNotice v-if="fieldNameValidationMessage && !isManageMode" class="field-name-warning" type="warning">
				{{ fieldNameValidationMessage }}
			</VNotice>

			<section v-if="showAdvancedMode" class="section advanced-section">
				<div class="label type-label section-title-label relationship-title">{{ $t('relationship') }}</div>

				<div class="relationship-grid">
					<div class="field">
						<div class="type-label">{{ $t('this_collection') }}</div>
						<VInput disabled :model-value="collection" class="monospace" />
					</div>

					<div class="field">
						<div class="type-label">{{ $t('translations_collection') }}</div>
						<VInput
							v-model="translationsCollectionName"
							db-safe
							class="monospace"
							:class="{ error: translationsCollectionExists }"
							:disabled="isManageMode"
							:placeholder="$t('a_unique_table_name')"
						/>
					</div>

					<div class="field">
						<div class="type-label">{{ $t('languages_collection') }}</div>
						<VSelect
							v-if="!isManageMode"
							v-model="languagesCollection"
							:items="languagesCollectionOptions"
							allow-other
							:placeholder="$t('search_collection')"
						/>
						<VInput v-else :model-value="props.config?.languagesCollection ?? '-'" disabled class="monospace" />
					</div>

					<VInput :model-value="parentPrimaryKey" disabled :placeholder="$t('primary_key')" class="monospace" />
					<VInput v-model="parentForeignKeyField" :disabled="isManageMode || autoFillNames" class="monospace" db-safe />
					<div class="spacer" />
					<div class="spacer" />
					<VInput
						v-model="languageForeignKeyField"
						:disabled="isManageMode || autoFillNames"
						class="monospace"
						db-safe
					/>
					<VInput :model-value="languagePrimaryKey" disabled :placeholder="$t('primary_key')" class="monospace" />
					<div class="spacer" />
					<VCheckbox v-if="!isManageMode" v-model="autoFillNames" block :label="$t('auto_fill')" />
					<div v-else class="spacer" />

					<VIcon class="arrow" name="arrow_forward" />
					<VIcon class="arrow" name="arrow_back" />
				</div>

				<small v-if="translationsCollectionExists" class="error-text">
					{{ $t('translations_collection_already_exists') }}
				</small>
			</section>

			<VButton
				class="submit-button"
				full-width
				:loading="submitting"
				:disabled="submitting || !canSubmit"
				@click="submit"
			>
				{{ isManageMode ? $t('save') : $t('enable') }}
			</VButton>

			<VNotice
				v-if="!isManageMode || selectedFields.length > 0"
				class="generated-data"
				type="warning"
				multiline
				indent-content
			>
				<template #title>
					<template v-if="isManageMode">
						{{ $t('fields_to_add_to_translations') }}
					</template>
					<div v-else class="generated-data-title">
						<p class="generated-data-note">{{ $t('translations_copy_data_note') }}</p>
						<span>{{ $t('new_data_alert') }}</span>
					</div>
				</template>

				<p class="generated-data-side-effect-note">{{ $t('translations_source_fields_hidden_note') }}</p>

				<template v-if="isManageMode">
					<ul v-if="previewFields.length > 0">
						<li v-for="field in previewFields" :key="field" class="mono">{{ field }}</li>
					</ul>
					<span v-else>{{ $t('translations_fields_up_to_date') }}</span>
				</template>

				<template v-else>
					<div v-if="previewCollections.length > 0" class="preview-block">
						<div class="preview-label">{{ $t('translations_preview_collections') }}</div>
						<ul>
							<li v-for="entry in previewCollections" :key="entry" class="mono">{{ entry }}</li>
						</ul>
					</div>

					<div v-if="previewFields.length > 0" class="preview-block">
						<div class="preview-label">{{ $t('translations_preview_fields') }}</div>
						<ul>
							<li v-for="entry in previewFields" :key="entry" class="mono">{{ entry }}</li>
						</ul>
					</div>

					<div v-if="previewRelations.length > 0" class="preview-block">
						<div class="preview-label">{{ $t('translations_preview_relations') }}</div>
						<ul>
							<li v-for="entry in previewRelations" :key="entry" class="mono">{{ entry }}</li>
						</ul>
					</div>
				</template>
			</VNotice>
		</div>
	</VDrawer>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.content {
	padding: var(--content-padding);
}

.section + .section {
	margin-block-start: 20px;
}

.section-title-label {
	margin-block-end: 10px;
	white-space: normal;
}

.selection-footer {
	position: sticky;
	inset-inline-end: 0;
	inset-block-end: 0;
	float: inline-end;
	inline-size: max-content;
	padding: 4px 8px;
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
	}
}

.selection-panel {
	max-block-size: 280px;
	overflow: auto;
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--background);
}

.selection-content {
	padding: 12px;
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.toggle-advanced {
	display: block;
	margin-block-start: 14px;
	color: var(--theme--foreground-subdued);
	font-weight: 600;
	transition: color var(--fast) var(--transition);

	&:hover {
		color: var(--theme--primary);
	}
}

.field-name-warning {
	margin-block-start: 12px;
}

.advanced-section {
	margin-block-start: 14px;
}

.relationship-title {
	margin-block-end: 10px;
}

.relationship-grid {
	--v-select-font-family: var(--theme--fonts--monospace--font-family);
	--v-input-font-family: var(--theme--fonts--monospace--font-family);

	position: relative;
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12px 28px;
	margin-block-start: 10px;

	.v-icon.arrow {
		--v-icon-color: var(--theme--primary);

		position: absolute;
		transform: translateX(-50%);
		pointer-events: none;

		html[dir='rtl'] & {
			transform: translateX(50%) scaleX(-1);
		}

		&:first-of-type {
			inset-block-end: 161px;
			inset-inline-start: 32.5%;
		}

		&:last-of-type {
			inset-block-end: 89px;
			inset-inline-start: 67.4%;
		}
	}
}

.type-label {
	margin-block-end: 8px;

	@include mixins.no-wrap;
}

.spacer {
	min-block-size: var(--theme--form--field--input--height);
}

.monospace {
	--v-input-font-family: var(--theme--fonts--monospace--font-family);
}

.error {
	--v-input-border-color: var(--theme--danger);
	--v-input-border-color-hover: var(--theme--danger);
	--v-input-border-color-focus: var(--theme--danger);
}

.error-text {
	display: inline-block;
	margin-block-start: 8px;
	color: var(--theme--danger);
}

.generated-data {
	margin-block-start: 16px;

	:deep(.v-notice-title) {
		inline-size: 100%;
	}

	:deep(.v-notice-content) {
		inline-size: 100%;
		margin-block-start: 8px;
	}

	ul {
		margin: 0;
		padding-inline-start: 20px;
	}

	li {
		display: list-item;
	}
}

.generated-data-title {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.generated-data-note {
	margin: 0;
	font-weight: 400;
	line-height: 1.4;
}

.generated-data-side-effect-note {
	margin-block-end: 8px;
}

.preview-block + .preview-block {
	margin-block-start: 8px;
}

.preview-label {
	font-weight: 600;
}

.mono {
	font-family: var(--theme--fonts--monospace--font-family);
}

.submit-button {
	margin-block-start: 20px;
	min-block-size: 44px;
}

@media (max-width: 960px) {
	.relationship-grid {
		grid-template-columns: 1fr;

		.v-icon.arrow {
			display: none;
		}

		.spacer {
			display: none;
		}
	}
}
</style>
