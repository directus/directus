<template>
	<div class="translations" :class="{ split: splitViewEnabled }">
		<div class="primary" :class="splitViewEnabled ? 'half' : 'full'">
			<language-select v-if="showLanguageSelect" v-model="firstLang" :items="languageOptions">
				<template #append>
					<v-icon
						v-if="splitViewAvailable && !splitViewEnabled"
						v-tooltip="t('interfaces.translations.toggle_split_view')"
						name="flip"
						clickable
						@click.stop="splitView = true"
					/>
				</template>
			</language-select>
			<v-form
				v-if="languageOptions.find((lang) => lang.value === firstLang)"
				:primary-key="
					relationInfo?.junctionPrimaryKeyField.field
						? firstItemInitial?.[relationInfo?.junctionPrimaryKeyField.field]
						: null
				"
				:disabled="disabled"
				:loading="loading"
				:fields="fields"
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
			<language-select v-model="secondLang" :items="languageOptions" secondary>
				<template #append>
					<v-icon
						v-tooltip="t('interfaces.translations.toggle_split_view')"
						name="close"
						clickable
						@click.stop="splitView = !splitView"
					/>
				</template>
			</language-select>
			<v-form
				v-if="languageOptions.find((lang) => lang.value === secondLang)"
				:primary-key="
					relationInfo?.junctionPrimaryKeyField.field
						? secondItemInitial?.[relationInfo?.junctionPrimaryKeyField.field]
						: null
				"
				:disabled="disabled"
				:loading="loading"
				:initial-values="secondItemInitial"
				:fields="fields"
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

<script setup lang="ts">
import api from '@/api';
import VDivider from '@/components/v-divider.vue';
import VForm from '@/components/v-form/v-form.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import { useRelationM2M } from '@/composables/use-relation-m2m';
import { DisplayItem, RelationQueryMultiple, useRelationMultiple } from '@/composables/use-relation-multiple';
import { useWindowSize } from '@/composables/use-window-size';
import vTooltip from '@/directives/tooltip';
import { useFieldsStore } from '@/stores/fields';
import { unexpectedError } from '@/utils/unexpected-error';
import { toArray } from '@directus/shared/utils';
import { isNil } from 'lodash';
import { computed, ref, toRefs, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import LanguageSelect from './language-select.vue';

const props = withDefaults(
	defineProps<{
		collection: string;
		field: string;
		primaryKey: string | number;
		languageField?: string | null;
		languageDirectionField?: string | null;
		defaultLanguage?: string | null;
		userLanguage?: boolean;
		value: (number | string | Record<string, any>)[] | Record<string, any>;
		autofocus?: boolean;
		disabled?: boolean;
	}>(),
	{
		languageField: () => null,
		languageDirectionField: () => 'direction',
		value: () => [],
		autofocus: false,
		disabled: false,
		defaultLanguage: () => null,
		userLanguage: false,
	}
);

const emit = defineEmits(['input']);

const value = computed({
	get: () => props.value,
	set: (val) => {
		emit('input', val);
	},
});

const { collection, field, primaryKey, defaultLanguage, userLanguage } = toRefs(props);
const { relationInfo } = useRelationM2M(collection, field);
const { t, locale } = useI18n();

const fieldsStore = useFieldsStore();

const { width } = useWindowSize();

const splitView = ref(false);
const firstLang = ref<string>();
const secondLang = ref<string>();

watch(splitView, (splitViewEnabled) => {
	const lang = languageOptions.value;

	if (splitViewEnabled && secondLang.value === firstLang.value) {
		secondLang.value = lang[0].value === firstLang.value ? lang[1].value : lang[0].value;
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

const { create, update, displayItems, loading, fetchedItems, getItemEdits } = useRelationMultiple(
	value,
	query,
	relationInfo,
	primaryKey
);

const firstItem = computed(() => {
	const item = getItemWithLang(displayItems.value, firstLang.value);
	if (item === undefined) return undefined;

	return getItemEdits(item);
});
const secondItem = computed(() => {
	const item = getItemWithLang(displayItems.value, secondLang.value);
	if (item === undefined) return undefined;

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

function updateValue(item: DisplayItem, lang: string | undefined) {
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
		} else {
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

	watch(relationInfo, fetchLanguages, { immediate: true });

	const languageOptions = computed(() => {
		const langField = relationInfo.value?.junctionField.field;

		if (!langField) return [];

		const writableFields = fields.value.filter(
			(field) => field.type !== 'alias' && field.meta?.hidden === false && field.meta.readonly === false
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

		if (props.languageField !== null) {
			fields.add(props.languageField);
		}

		if (props.languageDirectionField !== null) {
			fields.add(props.languageDirectionField);
		}

		const pkField = relationInfo.value.relatedPrimaryKeyField.field;

		fields.add(pkField);

		loading.value = true;

		try {
			const response = await api.get<any>(`/items/${relationInfo.value.relatedCollection.collection}`, {
				params: {
					fields: Array.from(fields),
					limit: -1,
					sort: props.languageField ?? pkField,
				},
			});

			languages.value = response.data.data ? toArray(response.data.data) : [];

			if (!firstLang.value) {
				const userLocale = userLanguage.value ? locale.value : defaultLanguage.value;
				const lang = languages.value.find((lang) => lang[pkField] === userLocale) || languages.value[0];
				firstLang.value = lang?.[pkField];
			}

			if (!secondLang.value) {
				secondLang.value = languages.value[1]?.[pkField];
			}
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			loading.value = false;
		}
	}
}
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.translations {
	@include form-grid;

	.v-form {
		--form-vertical-gap: 32px;
		--v-chip-color: var(--primary);
		--v-chip-background-color: var(--primary-alt);

		margin-top: 32px;
	}

	.primary {
		.v-divider {
			--v-divider-color: var(--primary-50);
		}
	}

	.secondary {
		.v-form {
			--primary: var(--secondary);
			--v-chip-color: var(--secondary);
			--v-chip-background-color: var(--secondary-alt);
		}

		.v-divider {
			--v-divider-color: var(--secondary-50);
		}
	}

	.primary,
	.secondary {
		.v-divider {
			margin-top: var(--form-vertical-gap);
		}
	}
}
</style>
