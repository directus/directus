<script setup lang="ts">
import { useCollection, useShortcut } from '@directus/composables';
import type { Field } from '@directus/types';
import { clone } from 'lodash';
import { computed, ref, unref } from 'vue';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';
import { getMcpSettingsField } from './mcp-settings';
import { getAvailableModels, getModelKey, getProviderIcon } from '@/ai/utils/available-models';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import VNotice from '@/components/v-notice.vue';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useLicenseStore } from '@/stores/license';
import { useServerStore } from '@/stores/server';
import { useSettingsStore } from '@/stores/settings';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';

const router = useRouter();

const settingsStore = useSettingsStore();
const serverStore = useServerStore();
const licenseStore = useLicenseStore();

const customLLMInputs = new Set([
	'ai_openai_compatible_name',
	'ai_openai_compatible_base_url',
	'ai_openai_compatible_api_key',
	'ai_openai_compatible_headers',
	'ai_openai_compatible_models',
]);

const aiTranslationInputs = new Set([
	'ai_translation_default_model',
	'ai_translation_glossary',
	'ai_translation_style_guide',
]);

const { fields: allFields } = useCollection('directus_settings');

const initialValues = ref(clone(settingsStore.settings));

const aiEdits = ref<Record<string, any> | null>(null);
const mcpEdits = ref<Record<string, any> | null>(null);

const effectiveAiSettings = computed(() => ({ ...(settingsStore.settings ?? {}), ...(aiEdits.value ?? {}) }));

const availableTranslationModels = computed(() => getAvailableModels(effectiveAiSettings.value));

const aiFields = computed(() =>
	unref(allFields)
		.filter((field) => {
			if (field.meta?.group !== 'ai_group' && field.field !== 'ai_group') return false;
			if (field.field === 'ai_translations_notice' && licenseStore.aiTranslationsEnabled === true) return false;

			if (field.field === 'ai_openai_compatible_notice' && licenseStore.customLLMEnabled === true) return false;
			return true;
		})
		.map((field) => {
			if (field.field === 'ai_translation_default_model') {
				return {
					...field,
					meta: {
						...field.meta,
						readonly: availableTranslationModels.value.length === 0 || licenseStore.aiTranslationsEnabled === false,
						options: {
							...(field.meta?.options ?? {}),
							allowNone: true,
							choices: availableTranslationModels.value.map((modelDefinition) => ({
								text: modelDefinition.name,
								value: getModelKey(modelDefinition),
								icon: getProviderIcon(modelDefinition.provider),
							})),
						},
					},
				} as Field;
			}

			if (licenseStore.aiTranslationsEnabled === false && aiTranslationInputs.has(field.field)) {
				return { ...field, meta: { ...field.meta, readonly: true } } as typeof field;
			}

			if (licenseStore.customLLMEnabled === true || customLLMInputs.has(field.field) === false) return field;
			return { ...field, meta: { ...field.meta, readonly: true } } as typeof field;
		}),
);

const mcpFields = computed(() =>
	unref(allFields).flatMap((field) => {
		const mcpField = getMcpSettingsField(field, serverStore.info);
		return mcpField ? [mcpField] : [];
	}),
);

const hasEdits = computed(
	() =>
		(aiEdits.value !== null && Object.keys(aiEdits.value).length > 0) ||
		(mcpEdits.value !== null && Object.keys(mcpEdits.value).length > 0),
);

const saving = ref(false);

useShortcut('meta+s', () => {
	if (hasEdits.value) save();
});

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);

async function save() {
	const combinedEdits = { ...(aiEdits.value ?? {}), ...(mcpEdits.value ?? {}) };
	if (Object.keys(combinedEdits).length === 0) return;
	saving.value = true;
	await settingsStore.updateSettings(combinedEdits);
	await serverStore.hydrate();
	aiEdits.value = null;
	mcpEdits.value = null;
	saving.value = false;
	initialValues.value = clone(settingsStore.settings);
}

function discardAndLeave() {
	if (!leaveTo.value) return;
	aiEdits.value = null;
	mcpEdits.value = null;
	confirmLeave.value = false;
	router.push(leaveTo.value);
}
</script>

<template>
	<PrivateView :title="$t('settings_ai')" icon="smart_toy">
		<template #actions:primary>
			<PrivateViewHeaderBarActionButton
				:label="$t('save')"
				:disabled="!hasEdits"
				:loading="saving"
				icon="check"
				@click="save"
			/>
		</template>

		<template #navigation>
			<SettingsNavigation />
		</template>

		<div class="settings">
			<VNotice v-if="!serverStore.info.ai_enabled" type="warning" class="disabled-notice">
				{{ $t('ai_disabled_by_env') }}
			</VNotice>
			<VForm
				v-model="aiEdits"
				:initial-values="initialValues"
				:fields="aiFields"
				:primary-key="1"
				:disabled="!serverStore.info.ai_enabled"
			/>

			<div class="mcp-section">
				<VNotice v-if="!serverStore.info.mcp_enabled" type="warning" class="disabled-notice">
					{{ $t('mcp_disabled_by_env') }}
				</VNotice>
				<VForm
					v-model="mcpEdits"
					:initial-values="initialValues"
					:fields="mcpFields"
					:primary-key="1"
					:disabled="!serverStore.info.mcp_enabled"
				/>
			</div>
		</div>

		<VDialog v-model="confirmLeave" @esc="confirmLeave = false" @apply="discardAndLeave">
			<VCard>
				<VCardTitle>{{ $t('unsaved_changes') }}</VCardTitle>
				<VCardText>{{ $t('unsaved_changes_copy') }}</VCardText>
				<VCardActions>
					<VButton secondary @click="discardAndLeave">
						{{ $t('discard_changes') }}
					</VButton>
					<VButton @click="confirmLeave = false">{{ $t('keep_editing') }}</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</PrivateView>
</template>

<style lang="scss" scoped>
.settings {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}

.disabled-notice {
	margin-block-end: var(--theme--form--row-gap);
}

.mcp-section {
	margin-block-start: var(--theme--form--row-gap);
}
</style>
