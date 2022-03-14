<template>
	<v-dialog :model-value="modelValue" persistent @esc="closeDialog">
		<v-card>
			<v-card-title>
				{{ t('create_translation_string') }}
			</v-card-title>
			<v-card-text>
				<div class="fields">
					<v-input
						v-model="values.key"
						class="full translation-key"
						:autofocus="!values.key"
						:placeholder="t('key') + '...'"
						@keyup.enter="save"
					/>
					<interface-list
						class="full"
						:value="values.translations"
						:placeholder="t('no_translations')"
						template="{{ translation }} ({{ language }})"
						:fields="[
							{
								field: 'language',
								name: '$t:language',
								type: 'string',
								meta: {
									interface: 'system-language',
									width: 'half',
									required: true,
								},
							},
							{
								field: 'translation',
								name: '$t:field_options.directus_collections.collection_name',
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
				<v-button :disabled="values.key === null" :loading="saving" @click="saveNewTranslationString">
					{{ t('save') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts" setup>
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTranslationStrings, TranslationString } from '../../composables/use-translation-strings';

interface Props {
	modelValue: boolean;
	translationString?: TranslationString | null;
}

const props = withDefaults(defineProps<Props>(), { modelValue: false, translationString: () => null });

const emit = defineEmits(['update:modelValue']);

const { t } = useI18n();

const { translationStrings, saving, save } = useTranslationStrings();

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

function onListInput(val: Record<string, string>[]) {
	if (!val) {
		values.translations = null;
		return;
	}

	const uniqueTranslations = val
		.reduce<Map<string, Record<string, string>>>((acc, cur) => acc.set(cur.language, cur), new Map())
		.values();

	values.translations = Array.from(uniqueTranslations);
}

function closeDialog() {
	emit('update:modelValue', false);
}

async function saveNewTranslationString() {
	const newTranslationStrings = translationStrings.value ? [...translationStrings.value, values] : [values];
	try {
		await save(newTranslationStrings);
		closeDialog();
	} catch {
		// Save shows unexpected error dialog
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
</style>
