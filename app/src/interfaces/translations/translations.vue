<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import { useRelationM2M } from '@/composables/use-relation-m2m';
import { DisplayItem, RelationQueryMultiple, useRelationMultiple } from '@/composables/use-relation-multiple';
import { useWindowSize } from '@/composables/use-window-size';
import { useInjectNestedValidation } from '@/composables/use-nested-validation';
import vTooltip from '@/directives/tooltip';
import { useFieldsStore } from '@/stores/fields';
import { fetchAll } from '@/utils/fetch-all';
import { unexpectedError } from '@/utils/unexpected-error';
import { getEndpoint } from '@directus/utils';
import { isNil } from 'lodash';
import { computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import TranslationForm from './translation-form.vue';
import { validateItem } from '@/utils/validate-item';

const props = withDefaults(
	defineProps<{
		collection: string;
		field: string;
		primaryKey: string | number;
		languageField?: string | null;
		languageDirectionField?: string | null;
		defaultLanguage?: string | null;
		defaultOpenSplitView?: boolean;
		userLanguage?: boolean;
		value: (number | string | Record<string, any>)[] | Record<string, any> | null;
		autofocus?: boolean;
		disabled?: boolean;
	}>(),
	{
		languageField: null,
		languageDirectionField: 'direction',
		value: () => [],
		autofocus: false,
		disabled: false,
		defaultLanguage: null,
		defaultOpenSplitView: false,
		userLanguage: false,
	},
);

const emit = defineEmits(['input']);

const value = computed({
	get: () => props.value ?? [],
	set: (val) => {
		emit('input', val);
	},
});

const { collection, field, primaryKey, defaultLanguage, userLanguage } = toRefs(props);
const { relationInfo } = useRelationM2M(collection, field);
const { t, locale } = useI18n();

const fieldsStore = useFieldsStore();

const { width } = useWindowSize();

const splitView = ref(props.defaultOpenSplitView);
const firstLang = ref<string>();
const secondLang = ref<string>();

watch(splitView, (splitViewEnabled) => {
	if (splitViewEnabled && secondLang.value === firstLang.value) {
		const lang = languageOptions.value;
		const alternativeLang = lang.find((l) => l.value !== firstLang.value);
		secondLang.value = alternativeLang?.value ?? lang[0]?.value;
	}
});

const { languageOptions, loading: languagesLoading } = useLanguages();

const splitViewAvailable = computed(() => width.value > 960 && languageOptions.value.length > 1);
const splitViewEnabled = computed(() => splitViewAvailable.value && splitView.value);

const fields = computed(() => {
	if (!relationInfo.value) return [];
	return fieldsStore.getFieldsForCollection(relationInfo.value.junctionCollection.collection);
});

const query = ref<RelationQueryMultiple>({ fields: ['*'], limit: -1, page: 1 });

const {
	create,
	update,
	remove,
	isLocalItem,
	displayItems,
	loading: itemsLoading,
	fetchedItems,
	getItemEdits,
} = useRelationMultiple(value, query, relationInfo, primaryKey);

useNestedValidation();

function getItemWithLang<T extends Record<string, any>>(items: T[], lang: string | undefined) {
	const langField = relationInfo.value?.junctionField.field;
	const relatedPKField = relationInfo.value?.relatedPrimaryKeyField.field;
	if (!langField || !relatedPKField || !lang) return;

	return items.find((item) => item?.[langField]?.[relatedPKField] === lang);
}

function updateValue(item: DisplayItem | undefined, lang: string | undefined) {
	const info = relationInfo.value;
	if (!info) return;

	const itemInfo = getItemWithLang(displayItems.value, lang);

	if (itemInfo) {
		const itemUpdates = {
			...item,
			[info.junctionField.field]: {
				[info.relatedPrimaryKeyField.field]: lang,
			},
			$type: itemInfo?.$type,
			$index: itemInfo?.$index,
			$edits: itemInfo?.$edits,
		};

		if (itemInfo[info.junctionPrimaryKeyField.field] !== undefined) {
			itemUpdates[info.junctionPrimaryKeyField.field] = itemInfo[info.junctionPrimaryKeyField.field];
		} else if (primaryKey.value !== '+') {
			itemUpdates[info.reverseJunctionField.field] = primaryKey.value;
		}

		update(itemUpdates);
	} else {
		create({
			...item,
			[info.junctionField.field]: {
				[info.relatedPrimaryKeyField.field]: lang,
			},
		});
	}
}

const translationProps = computed(() => ({
	languageOptions: languageOptions.value,
	disabled: props.disabled,
	autofocus: props.autofocus,
	relationInfo: relationInfo.value,
	getItemWithLang,
	loading: languagesLoading.value || itemsLoading.value,
	displayItems: displayItems.value,
	fetchedItems: fetchedItems.value,
	getItemEdits,
	isLocalItem,
	updateValue,
	remove,
}));

function useLanguages() {
	const languages = ref<Record<string, any>[]>([]);
	const loading = ref(false);
	const error = ref<any>(null);
	const fieldsStore = useFieldsStore();

	watch(relationInfo, fetchLanguages, { immediate: true });

	const languageOptions = computed(() => {
		const langField = relationInfo.value?.junctionField.field;

		if (!langField) return [];

		const writableFields = fields.value.filter(
			(field) => field.type !== 'alias' && field.meta?.hidden === false && field.meta.readonly === false,
		);

		const totalFields = writableFields.length;

		return languages.value.map((language) => {
			const info = relationInfo.value;
			if (!info) return language;

			const langCode = language[info.relatedPrimaryKeyField.field];

			const edits = getItemWithLang(displayItems.value, langCode);

			const filledFields = writableFields.filter((field) => !isNil((edits ?? {})[field.field])).length;

			return {
				text: language[props.languageField ?? relationInfo.value.relatedPrimaryKeyField.field],
				direction: props.languageDirectionField ? language[props.languageDirectionField] : undefined,
				value: langCode,
				edited: edits?.$type !== undefined,
				progress: Math.round((filledFields / totalFields) * 100),
				max: totalFields,
				current: filledFields,
			};
		});
	});

	return { languageOptions, loading, error };

	async function fetchLanguages() {
		if (!relationInfo.value) return;

		const fields = new Set<string>();
		const collection = relationInfo.value.relatedCollection.collection;

		if (props.languageField !== null && fieldsStore.getField(collection, props.languageField)) {
			fields.add(props.languageField);
		}

		if (props.languageDirectionField !== null && fieldsStore.getField(collection, props.languageDirectionField)) {
			fields.add(props.languageDirectionField);
		}

		const pkField = relationInfo.value.relatedPrimaryKeyField.field;
		const sortField = relationInfo.value.relatedCollection.meta?.sort_field;

		fields.add(pkField);

		loading.value = true;

		try {
			languages.value = await fetchAll<Record<string, any>[]>(getEndpoint(collection), {
				params: {
					fields: Array.from(fields),
					sort: sortField ?? props.languageField ?? pkField,
				},
			});

			if (!firstLang.value) {
				const userLocale = userLanguage.value ? locale.value : defaultLanguage.value;
				const lang = languages.value.find((lang) => lang[pkField] === userLocale) || languages.value[0];
				firstLang.value = lang?.[pkField];
			}

			if (!secondLang.value) {
				const defaultLocale = userLanguage.value ? defaultLanguage.value : null;
				let lang = languages.value.find((lang) => lang[pkField] === defaultLocale) || languages.value[0];

				if (!lang || lang[pkField] === firstLang.value) {
					lang = languages.value.find((lang) => lang[pkField] !== firstLang.value) || languages.value[1];
				}

				secondLang.value = lang?.[pkField];
			}
		} catch (error) {
			unexpectedError(error);
		} finally {
			loading.value = false;
		}
	}
}

function useNestedValidation() {
	const { updateNestedValidationErrors } = useInjectNestedValidation();

	watch(
		() => displayItems.value,
		(updatedDisplayItems) => {
			const errorsMap = getErrorsPerLanguage(updatedDisplayItems);

			const validationErrors = Object.entries(errorsMap)?.flatMap(([lang, items]) =>
				items.map((item: Record<string, any>) => updateFieldName(item, lang)),
			);

			updateNestedValidationErrors(props.field, validationErrors);
		},
	);

	function getErrorsPerLanguage(updatedDisplayItems: DisplayItem[]) {
		const errorsMap: Record<string, any> = {};

		updatedDisplayItems?.forEach((item) => {
			const langField = relationInfo.value?.junctionField.field;
			const relatedPKField = relationInfo.value?.relatedPrimaryKeyField.field;
			if (!langField || !relatedPKField) return;

			const lang = item?.[langField]?.[relatedPKField];
			if (!lang) return;

			const errorsPerLanguage = validateItem(item, fields.value, item.$type === 'created', true);
			if (!errorsPerLanguage?.length) return;

			errorsMap[lang] = errorsPerLanguage.map((error) => addNestedProperties(error, lang));
		});

		return errorsMap;
	}

	function addNestedProperties(error: any, lang: string) {
		const field = fields.value?.find((field) => field.field === error.field);

		const nestedNames = {
			[lang]: languageOptions.value.find((langOption) => langOption.value === lang)?.text ?? lang,
			[error.field]: field?.name ?? error.field,
		};

		const validation_message = field?.meta?.validation_message;

		return { ...error, nestedNames, validation_message };
	}

	function updateFieldName(item: Record<string, any>, lang: string) {
		return { ...item, field: `${props.field}.${lang}.${item.field}` };
	}
}
</script>

<template>
	<div class="translations" :class="{ split: splitViewEnabled }">
		<translation-form v-model:lang="firstLang" v-bind="translationProps" :class="splitViewEnabled ? 'half' : 'full'">
			<template #split-view="{ active, toggle }">
				<v-icon
					v-if="splitViewAvailable && !splitViewEnabled"
					v-tooltip="t('interfaces.translations.toggle_split_view')"
					name="flip"
					clickable
					@click.stop="
						if (active) toggle();
						splitView = true;
					"
				/>
			</template>
		</translation-form>

		<translation-form
			v-if="splitViewEnabled"
			v-model:lang="secondLang"
			v-bind="translationProps"
			secondary
			class="half"
		>
			<template #split-view>
				<v-icon
					v-tooltip="t('interfaces.translations.toggle_split_view')"
					name="flip"
					clickable
					@click="splitView = false"
				/>
			</template>
		</translation-form>
	</div>
</template>

<style lang="scss" scoped>
@use '@/styles/mixins';

.translations {
	@include mixins.form-grid;

	.v-form {
		--theme--form--row-gap: 32px;
		--v-chip-color: var(--theme--primary);
		--v-chip-background-color: var(--theme--primary-background);

		margin-top: 32px;
	}

	.primary {
		.v-divider {
			--v-divider-color: var(--theme--primary-subdued);
		}
	}

	.secondary {
		.v-form {
			--primary: var(--theme--secondary);
			--v-chip-color: var(--theme--secondary);
			--v-chip-background-color: var(--secondary-alt);
		}

		.v-divider {
			--v-divider-color: var(--secondary-50);
		}
	}

	.primary,
	.secondary {
		.v-divider {
			margin-top: var(--theme--form--row-gap);
		}
	}
}
</style>
