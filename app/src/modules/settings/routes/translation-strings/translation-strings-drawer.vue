<template>
	<v-drawer
		:title="translationString ? t('edit_translation_string') : t('create_translation_string')"
		icon="translate"
		:model-value="modelValue"
		@update:model-value="closeDrawer"
		@cancel="closeDrawer"
	>
		<template #actions>
			<v-dialog v-if="translationString" v-model="confirmDelete" @esc="confirmDelete = false">
				<template #activator="{ on }">
					<v-button class="delete-action" rounded icon secondary @click="on">
						<v-icon name="delete" />
					</v-button>
				</template>

				<v-card>
					<v-card-title>{{ t('delete_translation_string_copy', { key: values.key }) }}</v-card-title>

					<v-card-actions>
						<v-button secondary @click="confirmDelete = false">
							{{ t('cancel') }}
						</v-button>
						<v-button kind="danger" :loading="updating" @click="deleteTranslationString">
							{{ t('delete_label') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-button
				v-tooltip.bottom="t('save')"
				:loading="updating"
				:disabled="!values.key || !values.translations || isEqual(values, initialValues)"
				icon
				rounded
				@click="saveTranslationString"
			>
				<v-icon name="check" />
			</v-button>
		</template>

		<div class="drawer-content">
			<v-form v-model="formValues" :autofocus="!translationString" :initial-values="initialValues" :fields="fields" />
		</div>
	</v-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { isEqual } from 'lodash';
import { Field, DeepPartial } from '@directus/types';
import { useTranslationStrings, DisplayTranslationString } from '@/composables/use-translation-strings';

interface Props {
	modelValue: boolean;
	translationString?: DisplayTranslationString | null;
}

const props = withDefaults(defineProps<Props>(), { modelValue: false, translationString: () => null });

const emit = defineEmits(['remove:translation', 'update:translation', 'close-drawer']);

const { t } = useI18n();

const { translationString } = toRefs(props);

const confirmDelete = ref<boolean>(false);

const values = ref<DisplayTranslationString>({
	key: null,
	translations: null,
});

const formValues = computed<DisplayTranslationString>({
	get() {
		return values.value;
	},
	set(val) {
		values.value.key = val.key;

		if (!val.translations) {
			values.value.translations = val.translations;
			return;
		}

		// make sure translations are unique, and new ones will rewrite existing ones
		values.value.translations = [...new Map(val.translations.map((item) => [item.language, item])).values()];
	},
});

const initialValues = ref<DisplayTranslationString>({
	key: null,
	translations: null,
});

const fields = computed<DeepPartial<Field>[]>(() => {
	return [
		{
			field: 'key',
			name: '$t:key',
			type: 'string',
			meta: {
				interface: 'input',
				width: 'full',
				required: true,
				options: {
					placeholder: '$t:translation_string_key_placeholder',
					font: 'monospace',
					dbSafe: true,
				},
			},
		},
		{
			field: 'translations',
			name: '$t:translations',
			type: 'json',
			meta: {
				interface: 'list',
				width: 'full',
				required: true,
				options: {
					placeholder: '$t:translation_string_translations_placeholder',
					template: '{{ language }} {{ translation }}',
					sort: 'language',
					fields: [
						{
							field: 'language',
							name: '$t:language',
							type: 'string',
							meta: {
								interface: 'system-language',
								width: 'full',
								display: 'formatted-value',
								display_options: {
									font: 'monospace',
									color: 'var(--primary)',
									background: 'var(--primary-alt)',
								},
							},
						},
						{
							field: 'translation',
							name: '$t:translation',
							type: 'string',
							meta: {
								interface: 'input',
								width: 'half',
								options: {
									placeholder: '$t:field_options.directus_collections.translation_placeholder',
								},
							},
						},
					],
				},
			},
		},
	];
});

const { updating, upsertTranslation, removeTranslation } = useTranslationStrings();

watch(
	translationString,
	(newVal: DisplayTranslationString | null) => {
		values.value.key = newVal?.key ?? null;
		values.value.translations = newVal?.translations ?? null;
		initialValues.value.key = newVal?.key ?? null;
		initialValues.value.translations = newVal?.translations ?? null;
	},
	{ immediate: true }
);

function closeDrawer() {
	values.value.key = null;
	values.value.translations = null;
	initialValues.value.key = null;
	initialValues.value.translations = null;
	emit('close-drawer');
}

async function saveTranslationString() {
	if (!values.value) return;

	if (initialValues.value.key && initialValues.value.key !== values.value.key) {
		await removeTranslation(initialValues.value.key);
	}

	await upsertTranslation(values.value);
	closeDrawer();
}

async function deleteTranslationString() {
	if (!values.value || !initialValues.value || !initialValues.value.key) return;
	removeTranslation(initialValues.value.key);
	confirmDelete.value = false;
	closeDrawer();
}
</script>

<style lang="scss" scoped>
.drawer-content {
	padding: var(--content-padding);
	padding-bottom: var(--content-padding-bottom);
}
.v-button.delete-action {
	--v-button-background-color-hover: var(--danger) !important;
	--v-button-color-hover: var(--foreground-inverted) !important;
}
</style>
