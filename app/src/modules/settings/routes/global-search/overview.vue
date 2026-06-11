<script setup lang="ts">
import { useCollection, useShortcut } from '@directus/composables';
import type { Field, GlobalSearchConfig } from '@directus/types';
import { clone } from 'lodash';
import { computed, ref, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';
import {
	DEFAULT_GLOBAL_SEARCH_TRIGGER_RATE,
	getGlobalSearchCollections,
	getGlobalSearchTriggerRate,
	MAX_GLOBAL_SEARCH_TRIGGER_RATE,
	MIN_GLOBAL_SEARCH_TRIGGER_RATE,
} from '@/components/command-palette/utils/global-search-config';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VForm from '@/components/v-form/v-form.vue';
import VNotice from '@/components/v-notice.vue';
import { useEditsGuard } from '@/composables/use-edits-guard';
import { useSettingsStore } from '@/stores/settings';
import { notify } from '@/utils/notify';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';

const router = useRouter();
const { t } = useI18n();
const settingsStore = useSettingsStore();

const { fields: allFields } = useCollection('directus_settings');

const globalSearchFields = computed<Field[]>(() => {
	const configField = unref(allFields).find((field) => field.field === 'global_search_config');
	const options = configField?.meta?.options ?? {};

	const collectionsField = {
		...configField,
		field: 'collections',
		name: t('fields.directus_settings.global_search_collections'),
		meta: {
			...configField?.meta,
			group: null,
			options: {
				...options,
				fields: (options.fields ?? []).map((nestedField: Field) => {
					if (nestedField.field === 'collection') {
						return { ...nestedField, meta: { ...nestedField.meta, required: true } };
					}

					if (nestedField.field === 'fields') {
						return {
							...nestedField,
							meta: {
								...nestedField.meta,
								required: true,
								note: '$t:fields.directus_settings.global_search_fields_note',
							},
						};
					}

					if (nestedField.field === 'limit') {
						return {
							...nestedField,
							meta: {
								...nestedField.meta,
								note: '$t:fields.directus_settings.global_search_limit_note',
								options: {
									...(nestedField.meta?.options ?? {}),
									min: 1,
									max: 25,
									placeholder: '5',
								},
							},
						};
					}

					return nestedField;
				}),
			},
		},
	} as Field;

	return [
		{
			field: 'triggerRate',
			name: t('fields.directus_settings.global_search_trigger_rate'),
			type: 'integer',
			schema: {
				default_value: DEFAULT_GLOBAL_SEARCH_TRIGGER_RATE,
			},
			meta: {
				interface: 'input',
				width: 'half',
				options: {
					min: MIN_GLOBAL_SEARCH_TRIGGER_RATE,
					max: MAX_GLOBAL_SEARCH_TRIGGER_RATE,
					step: 10,
					placeholder: String(DEFAULT_GLOBAL_SEARCH_TRIGGER_RATE),
				},
				note: '$t:fields.directus_settings.global_search_trigger_rate_note',
			},
		} as unknown as Field,
		collectionsField,
	];
});

const initialValues = ref(getGlobalSearchFormValues(settingsStore.settings?.global_search_config));
const edits = ref<Record<string, any> | null>(null);

const hasEdits = computed(() => edits.value !== null && Object.keys(edits.value).length > 0);

const saving = ref(false);

useShortcut('meta+s', () => {
	if (hasEdits.value) save();
});

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);

async function save() {
	if (!edits.value || Object.keys(edits.value).length === 0) return;

	const values = {
		...initialValues.value,
		...edits.value,
	};

	const nextConfig = getGlobalSearchConfigFromFormValues(values);
	const invalidConfig = getInvalidConfig(nextConfig);

	if (invalidConfig) {
		notify({
			title: t('validation_errors_notice'),
			text: t(invalidConfig),
			type: 'error',
		});

		return;
	}

	saving.value = true;
	await settingsStore.updateSettings({ global_search_config: nextConfig });
	edits.value = null;
	saving.value = false;
	initialValues.value = getGlobalSearchFormValues(settingsStore.settings?.global_search_config);
}

function getInvalidConfig(config: unknown) {
	if (!config || typeof config !== 'object' || Array.isArray(config)) return 'global_search_config_invalid';

	const { triggerRate: triggerRateValue, collections } = config as GlobalSearchConfig;
	const triggerRate = Number(triggerRateValue);

	if (
		!Number.isInteger(triggerRate) ||
		triggerRate < MIN_GLOBAL_SEARCH_TRIGGER_RATE ||
		triggerRate > MAX_GLOBAL_SEARCH_TRIGGER_RATE
	) {
		return 'global_search_invalid_trigger_rate';
	}

	if (!Array.isArray(collections)) return 'global_search_config_invalid';

	for (const collectionConfig of collections) {
		if (!collectionConfig || typeof collectionConfig !== 'object') return 'global_search_config_invalid';

		const { collection, fields, limit } = collectionConfig as {
			collection?: unknown;
			fields?: unknown;
			limit?: unknown;
		};

		if (typeof collection !== 'string' || collection.length === 0) return 'global_search_missing_collection';
		if (!Array.isArray(fields) || fields.length === 0) return 'global_search_missing_fields';

		if (limit === null || limit === undefined || limit === '') continue;

		const numberLimit = Number(limit);

		if (!Number.isInteger(numberLimit) || numberLimit < 1 || numberLimit > 25) return 'global_search_invalid_limit';
	}

	return null;
}

function getGlobalSearchFormValues(config: GlobalSearchConfig | null | undefined) {
	return {
		triggerRate: getGlobalSearchTriggerRate(config),
		collections: clone(getGlobalSearchCollections(config)),
	};
}

function getGlobalSearchConfigFromFormValues(values: Record<string, any>): GlobalSearchConfig {
	return {
		triggerRate: Number(values.triggerRate),
		collections: Array.isArray(values.collections) ? values.collections : [],
	};
}

function discardAndLeave() {
	if (!leaveTo.value) return;
	edits.value = null;
	confirmLeave.value = false;
	router.push(leaveTo.value);
}
</script>

<template>
	<PrivateView :title="$t('global_search')" icon="search">
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
			<VNotice class="intro-notice" type="info">
				{{ $t('fields.directus_settings.global_search_notice') }}
			</VNotice>
			<VForm v-model="edits" :initial-values="initialValues" :fields="globalSearchFields" :primary-key="1" />
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

.intro-notice {
	margin-block-end: var(--theme--form--row-gap);
}
</style>
