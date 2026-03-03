<script setup lang="ts">
import { isSystemCollection } from '@directus/system-data';
import { computed, inject, ref, watch } from 'vue';
import SystemCollectionsTranslationsDialog from './system-collections-translations-dialog.vue';
import { detectTranslationConfigs, isFieldEligibleForTranslations } from './utils';
import VButton from '@/components/v-button.vue';
import VNotice from '@/components/v-notice.vue';
import VSelect from '@/components/v-select/v-select.vue';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';

const formValues = inject('values', ref({ collection: null as string | null }));
const fieldsStore = useFieldsStore();
const relationsStore = useRelationsStore();

const dialogActive = ref(false);
const dialogMode = ref<'enable' | 'manage'>('enable');
const selectedTranslationField = ref<string | null>(null);

const collection = computed(() => formValues.value.collection);

const isSystem = computed(() => {
	if (!collection.value) return false;
	return isSystemCollection(collection.value);
});

const collectionFields = computed(() => {
	if (!collection.value) return [];
	return fieldsStore.getFieldsForCollection(collection.value);
});

const primaryKeyField = computed(() => {
	if (!collection.value) return null;
	return fieldsStore.getPrimaryKeyFieldForCollection(collection.value);
});

const availableFields = computed(() => {
	return collectionFields.value.filter((field) =>
		isFieldEligibleForTranslations(field, primaryKeyField.value?.field ?? null),
	);
});

const translationConfigs = computed(() => {
	if (!collection.value) return [];
	return detectTranslationConfigs(collection.value, collectionFields.value, relationsStore.relations);
});

const hasTranslations = computed(() => translationConfigs.value.length > 0);
const validTranslationConfigs = computed(() => translationConfigs.value.filter((config) => config.valid));

const invalidTranslationsConfigCount = computed(
	() => translationConfigs.value.length - validTranslationConfigs.value.length,
);

const translationConfigOptions = computed(() =>
	validTranslationConfigs.value.map((config) => ({
		text: `${config.translationField} -> ${config.translationsCollection}`,
		value: config.translationField,
	})),
);

const selectedConfig = computed(() => {
	if (!selectedTranslationField.value) return null;
	return (
		validTranslationConfigs.value.find((config) => config.translationField === selectedTranslationField.value) ?? null
	);
});

watch(
	validTranslationConfigs,
	(configs) => {
		if (configs.length === 0) {
			selectedTranslationField.value = null;
			return;
		}

		const selectedStillExists = configs.some((config) => config.translationField === selectedTranslationField.value);

		if (!selectedStillExists) {
			selectedTranslationField.value = configs[0]!.translationField;
		}
	},
	{ immediate: true },
);

function openEnableDialog() {
	dialogMode.value = 'enable';
	dialogActive.value = true;
}

function openManageDialog() {
	if (!selectedConfig.value) return;
	dialogMode.value = 'manage';
	dialogActive.value = true;
}
</script>

<template>
	<div v-if="collection && !isSystem">
		<div v-if="hasTranslations" class="notice-block">
			<VNotice type="success" multiline indent-content>
				<template #title>
					{{ $t('translations_already_enabled') }}
				</template>

				<p>{{ $t('translations_manage_helper_description') }}</p>

				<div v-if="validTranslationConfigs.length > 1" class="field-group">
					<div class="field-label">{{ $t('translation_configuration') }}</div>
					<VSelect v-model="selectedTranslationField" :items="translationConfigOptions" :placeholder="$t('select')" />
				</div>

				<VNotice v-if="invalidTranslationsConfigCount > 0" type="warning">
					{{
						$t('translations_invalid_config_warning', {
							count: invalidTranslationsConfigCount,
						})
					}}
				</VNotice>
			</VNotice>

			<VButton class="notice-action" :disabled="!selectedConfig" @click="openManageDialog">
				{{ $t('add_fields') }}
			</VButton>
		</div>

		<div v-else class="notice-block">
			<VNotice>
				{{ $t('translations_enable_helper_description') }}
			</VNotice>

			<VButton class="notice-action" :disabled="availableFields.length === 0" @click="openEnableDialog">
				{{ $t('enable_translations') }}
			</VButton>
		</div>

		<SystemCollectionsTranslationsDialog
			v-model:active="dialogActive"
			:collection
			:mode="dialogMode"
			:config="dialogMode === 'manage' ? selectedConfig : null"
		/>
	</div>
</template>

<style scoped lang="scss">
.notice-block {
	display: flex;
	flex-direction: column;
}

.notice-action {
	inline-size: fit-content;
	margin-block-start: 10px;
}

.field-group {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.field-label {
	font-size: 14px;
}
</style>
