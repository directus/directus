<script setup lang="ts">
import { useCollection, useShortcut } from '@directus/composables';
import type { Field } from '@directus/types';
import { clone } from 'lodash';
import { computed, ref, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import SettingsNavigation from '../../components/navigation.vue';
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

const globalSearchFields = computed(() =>
	unref(allFields)
		.filter(
			(field) =>
				(field.meta?.group === 'global_search_group' || field.field === 'global_search_group') &&
				field.field !== 'global_search_group' &&
				field.field !== 'global_search_divider' &&
				field.field !== 'global_search_notice',
		)
		.map((field) => {
			if (field.field !== 'global_search_config') return field;

			const options = field.meta?.options ?? {};

			return {
				...field,
				meta: {
					...field.meta,
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
		}),
);

const initialValues = ref(clone(settingsStore.settings));
const edits = ref<Record<string, any> | null>(null);

const hasEdits = computed(() => edits.value !== null && Object.keys(edits.value).length > 0);

const saving = ref(false);

useShortcut('meta+s', () => {
	if (hasEdits.value) save();
});

const { confirmLeave, leaveTo } = useEditsGuard(hasEdits);

async function save() {
	if (!edits.value || Object.keys(edits.value).length === 0) return;
	const invalidConfig = getInvalidConfig(edits.value.global_search_config);

	if (invalidConfig) {
		notify({
			title: t('validation_errors_notice'),
			text: t(invalidConfig),
			type: 'error',
		});

		return;
	}

	saving.value = true;
	await settingsStore.updateSettings(edits.value);
	edits.value = null;
	saving.value = false;
	initialValues.value = clone(settingsStore.settings);
}

function getInvalidConfig(config: unknown) {
	if (!Array.isArray(config)) return null;

	for (const collectionConfig of config) {
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
