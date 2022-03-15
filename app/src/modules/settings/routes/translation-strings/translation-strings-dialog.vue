<template>
	<v-dialog :model-value="modelValue" persistent @esc="closeDialog">
		<v-card>
			<v-card-title>
				{{ translationString ? t('edit_translation_string') : t('create_translation_string') }}
			</v-card-title>
			<v-card-text>
				<div class="fields">
					<v-input
						v-model="values.key"
						class="full translation-key"
						:autofocus="!values.key"
						:placeholder="t('key') + '...'"
						@keyup.enter="saveNewTranslationString"
					/>
					<interface-list
						class="full"
						:value="values.translations"
						:placeholder="t('no_translations')"
						template="{{ language }} {{ translation }}"
						:fields="[
							{
								field: 'language',
								name: '$t:language',
								type: 'string',
								meta: {
									interface: 'system-language',
									width: 'half',
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
						]"
						@input="onListInput"
					/>
				</div>
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="closeDialog">{{ t('cancel') }}</v-button>
				<v-button v-if="translationString" class="delete-action" secondary @click="confirmDelete = true">
					{{ t('delete_label') }}
				</v-button>
				<v-button :disabled="values.key === null" :loading="updating" @click="saveNewTranslationString">
					{{ t('save') }}
				</v-button>
			</v-card-actions>

			<v-dialog v-model="confirmDelete" @esc="confirmDelete = false">
				<v-card>
					<v-card-title>{{ t('delete_translation_string_copy', { key: values.key }) }}</v-card-title>

					<v-card-actions>
						<v-button secondary @click="confirmDelete = false">
							{{ t('cancel') }}
						</v-button>
						<v-button kind="danger" :loading="updating" @click="deleteCurrentTranslationString">
							{{ t('delete_label') }}
						</v-button>
					</v-card-actions>
				</v-card>
			</v-dialog>
		</v-card>
	</v-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTranslationStrings, TranslationString, Translation } from '../../composables/use-translation-strings';

interface Props {
	modelValue: boolean;
	translationString?: TranslationString | null;
}

const props = withDefaults(defineProps<Props>(), { modelValue: false, translationString: () => null });

const emit = defineEmits(['update:modelValue', 'savedKey']);

const { t } = useI18n();

const confirmDelete = ref<boolean>(false);

const { translationStrings, updating, update } = useTranslationStrings();

const values = reactive<TranslationString>({
	key: null,
	translations: null,
});

watch(
	() => props.translationString,
	(newVal: TranslationString) => {
		values.key = newVal?.key ?? null;
		values.translations = newVal?.translations ?? null;
	},
	{ immediate: true }
);

function onListInput(val: Translation[]) {
	if (!val) {
		values.translations = null;
		return;
	}

	values.translations = [...new Map(val.map((item) => [item.language, item])).values()];
}

function closeDialog() {
	emit('update:modelValue', false);
}

async function saveNewTranslationString() {
	const newTranslationStrings = translationStrings.value ? [...translationStrings.value, values] : [values];
	try {
		await update(newTranslationStrings);
		emit('savedKey', values.key);
		closeDialog();
	} catch {
		// Update shows unexpected error dialog
	}
}

async function deleteCurrentTranslationString() {
	const newTranslationStrings = translationStrings.value
		? translationStrings.value.filter((val) => val.key !== values.key)
		: [];
	try {
		await update(newTranslationStrings);
		confirmDelete.value = false;
		closeDialog();
	} catch {
		// Update shows unexpected error dialog
	}
}
</script>

<style lang="scss" scoped>
.fields {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;
}

.full {
	grid-column: 1 / span 2;
}

.translation-key {
	--v-input-font-family: var(--family-monospace);
}

.v-button.delete-action {
	--v-button-background-color-hover: var(--danger);
	--v-button-color-hover: var(--foreground-inverted);
}
</style>
