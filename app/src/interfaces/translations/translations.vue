<script setup lang="ts">
import VDivider from '@/components/v-divider.vue';
import VForm from '@/components/v-form/v-form.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import { usePermissions } from '@/composables/use-permissions';
import { useRelationM2M } from '@/composables/use-relation-m2m';
import { DisplayItem, RelationQueryMultiple, useRelationMultiple } from '@/composables/use-relation-multiple';
import { useWindowSize } from '@/composables/use-window-size';
import { useInjectNestedValidation } from '@/composables/use-nested-validation';
import vTooltip from '@/directives/tooltip';
import { useFieldsStore } from '@/stores/fields';
import { fetchAll } from '@/utils/fetch-all';
import { unexpectedError } from '@/utils/unexpected-error';
import { getEndpoint } from '@directus/utils';
import { isEmpty, isNil } from 'lodash';
import { computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import LanguageSelect from './language-select.vue';
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
	if (splitViewEnabled) {
		const lang = languageOptions.value;
		const alternativeLang = lang.find((l) => l.value !== firstLang.value);
		secondLang.value = alternativeLang?.value ?? lang[0]?.value;
	}
});

const { languageOptions } = useLanguages();

const fields = computed(() => {
	if (!relationInfo.value) return [];
	return fieldsStore.getFieldsForCollection(relationInfo.value.junctionCollection.collection);
});

const query = ref<RelationQueryMultiple>({
	fields: ['*'],
	limit: -1,
	page: 1,
});

const { create, update, remove, isLocalItem, displayItems, loading, fetchedItems, getItemEdits } = useRelationMultiple(
	value,
	query,
	relationInfo,
	primaryKey,
);

const firstItem = computed(() => {
	const item = getItemWithLang(displayItems.value, firstLang.value);
	if (item === undefined) return undefined;

	const itemEdits = getItemEdits(item);

	if (isEmpty(itemEdits) && item.$type === 'deleted') return item;

	return getItemEdits(item);
});

const secondItem = computed(() => {
	const item = getItemWithLang(displayItems.value, secondLang.value);
	if (item === undefined) return undefined;

	const itemEdits = getItemEdits(item);

	if (isEmpty(itemEdits) && item.$type === 'deleted') return item;

	return getItemEdits(item);
});

const firstItemInitial = computed(() => getItemWithLang(fetchedItems.value, firstLang.value));
const secondItemInitial = computed(() => getItemWithLang(fetchedItems.value, secondLang.value));

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

const splitViewAvailable = computed(() => {
	return width.value > 960 && languageOptions.value.length > 1;
});

const splitViewEnabled = computed(() => {
	return splitViewAvailable.value && splitView.value;
});

const showLanguageSelect = computed(() => {
	return languageOptions.value.length > 1;
});

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

const firstItemPrimaryKey = computed(
	() => relationInfo.value && firstItemInitial.value?.[relationInfo.value.junctionPrimaryKeyField.field],
);

const secondItemPrimaryKey = computed(
	() => relationInfo.value && secondItemInitial.value?.[relationInfo.value.junctionPrimaryKeyField.field],
);

const firstItemNew = computed(() => !!(relationInfo.value && firstItemPrimaryKey.value === undefined));

const secondItemNew = computed(() => !!(relationInfo.value && secondItemPrimaryKey.value === undefined));

const {
	itemPermissions: { saveAllowed: firstSaveAllowed, fields: firstFields, deleteAllowed: firstDeleteAllowed },
} = usePermissions(
	computed(() => relationInfo.value?.junctionCollection.collection ?? null),
	firstItemPrimaryKey,
	firstItemNew,
);

const {
	itemPermissions: { saveAllowed: secondSaveAllowed, fields: secondFields, deleteAllowed: secondDeleteAllowed },
} = usePermissions(
	computed(() => relationInfo.value?.junctionCollection.collection ?? null),
	secondItemPrimaryKey,
	secondItemNew,
);

function getDeselectTooltip(item?: DisplayItem) {
	if (!item) return 'create_item';
	if (item.$type === 'deleted') return 'undo_removed_item';
	if (isLocalItem(item)) return 'delete_item';
	return 'remove_item';
}

function getIconName(item?: DisplayItem) {
	if (!item) return 'check_box_outline_blank';
	if (item.$type === 'deleted') return 'settings_backup_restore';
	return 'check_box';
}

function onToggleTranslation(lang?: string, item?: DisplayItem, itemInitial?: DisplayItem) {
	if (!isEmpty(item)) {
		remove(item);
		return;
	}

	if (!isEmpty(itemInitial)) {
		remove(itemInitial);
		return;
	}

	updateValue(item, lang);
}

const firstItemDisabled = computed(() => {
	return (
		props.disabled ||
		(!firstItem.value && !firstSaveAllowed.value) ||
		(firstItem.value && !firstDeleteAllowed.value && !isLocalItem(firstItem.value))
	);
});

const secondItemDisabled = computed(() => {
	return (
		props.disabled ||
		(!secondItem.value && !secondSaveAllowed.value) ||
		(secondItem.value && !secondDeleteAllowed.value && !isLocalItem(secondItem.value))
	);
});

useNestedValidation();

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
		<div class="primary" :class="splitViewEnabled ? 'half' : 'full'">
			<language-select
				v-if="showLanguageSelect"
				v-model="firstLang"
				:items="languageOptions"
				:danger="firstItem?.$type === 'deleted'"
			>
				<template #prepend>
					<v-icon
						v-tooltip="!firstItemDisabled ? t(getDeselectTooltip(firstItem)) : null"
						class="toggle"
						:disabled="firstItemDisabled"
						:name="getIconName(firstItem)"
						clickable
						@click.stop="onToggleTranslation(firstLang, firstItem, firstItemInitial)"
					/>
				</template>
				<template #append="{ active, toggle }">
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
			</language-select>
			<v-form
				v-if="languageOptions.find((lang) => lang.value === firstLang)"
				:key="languageOptions.find((lang) => lang.value === firstLang)?.value"
				:primary-key="
					relationInfo?.junctionPrimaryKeyField.field
						? firstItemInitial?.[relationInfo?.junctionPrimaryKeyField.field]
						: null
				"
				:class="{ unselected: !firstItem }"
				:disabled="disabled || !firstSaveAllowed || firstItem?.$type === 'deleted'"
				:loading="loading"
				:fields="firstFields"
				:model-value="firstItem"
				:initial-values="firstItemInitial"
				:badge="languageOptions.find((lang) => lang.value === firstLang)?.text"
				:direction="languageOptions.find((lang) => lang.value === firstLang)?.direction"
				:autofocus="autofocus"
				inline
				@update:model-value="updateValue($event, firstLang)"
			/>
			<v-divider />
		</div>

		<div v-if="splitViewEnabled" class="secondary" :class="splitViewEnabled ? 'half' : 'full'">
			<language-select
				v-model="secondLang"
				:items="languageOptions"
				secondary
				:danger="secondItem?.$type === 'deleted'"
			>
				<template #prepend>
					<v-icon
						v-tooltip="!secondItemDisabled ? t(getDeselectTooltip(secondItem)) : null"
						class="toggle"
						:disabled="secondItemDisabled"
						:name="getIconName(secondItem)"
						clickable
						@click.stop="onToggleTranslation(secondLang, secondItem, secondItemInitial)"
					/>
				</template>
				<template #append>
					<v-icon
						v-tooltip="t('interfaces.translations.toggle_split_view')"
						name="close"
						clickable
						@click="splitView = false"
					/>
				</template>
			</language-select>
			<v-form
				v-if="languageOptions.find((lang) => lang.value === secondLang)"
				:key="languageOptions.find((lang) => lang.value === secondLang)?.value"
				:primary-key="
					relationInfo?.junctionPrimaryKeyField.field
						? secondItemInitial?.[relationInfo?.junctionPrimaryKeyField.field]
						: null
				"
				:class="{ unselected: !secondItem }"
				:disabled="disabled || !secondSaveAllowed || secondItem?.$type === 'deleted'"
				:loading="loading"
				:initial-values="secondItemInitial"
				:fields="secondFields"
				:badge="languageOptions.find((lang) => lang.value === secondLang)?.text"
				:direction="languageOptions.find((lang) => lang.value === secondLang)?.direction"
				:model-value="secondItem"
				inline
				@update:model-value="updateValue($event, secondLang)"
			/>
			<v-divider />
		</div>
	</div>
</template>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.translations {
	@include form-grid;

	.toggle:not(.has-click) {
		--v-icon-color: var(--theme--primary-subdued);
	}

	.v-form {
		--theme--form--row-gap: 32px;
		--v-chip-color: var(--theme--primary);
		--v-chip-background-color: var(--theme--primary-background);

		margin-top: 32px;

		&.unselected {
			opacity: 0.5;

			&:hover,
			&:focus-within {
				opacity: 1;
			}
		}
	}

	.v-divider {
		--v-divider-color: var(--theme--primary-subdued);
		margin-top: var(--theme--form--row-gap);
	}

	.secondary {
		.toggle:not(.has-click) {
			--v-icon-color: var(--theme--secondary-subdued);
		}

		.v-form {
			--primary: var(--theme--secondary);
			--v-chip-color: var(--theme--secondary);
			--v-chip-background-color: var(--secondary-alt);
		}

		.v-divider {
			--v-divider-color: var(--secondary-50);
		}
	}
}
</style>
