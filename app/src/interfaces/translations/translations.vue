<template>
	<div class="translations" :class="{ split: splitViewEnabled }">
		<div class="primary" :class="splitViewEnabled ? 'half' : 'full'">
			<language-select v-model="firstLang" :items="languageOptions">
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
				:autofocus="autofocus"
				@update:modelValue="updateValue($event, firstLang)"
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
				:model-value="secondItem"
				@update:modelValue="updateValue($event, secondLang)"
			/>
			<v-divider />
		</div>
	</div>
</template>

<script setup lang="ts">
import LanguageSelect from './language-select.vue';
import { computed, ref, toRefs, watch } from 'vue';
import { useFieldsStore, useUserStore } from '@/stores/';
import { useI18n } from 'vue-i18n';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { notEmpty } from '@/utils/is-empty';
import { useWindowSize } from '@/composables/use-window-size';
import { DisplayItem, RelationQueryMultiple, useRelationM2M, useRelationMultiple } from '@/composables/use-relation';

const props = withDefaults(
	defineProps<{
		collection: string;
		field: string;
		primaryKey: string | number;
		languageField?: string | null;
		value: (number | string | Record<string, any>)[] | Record<string, any>;
		autofocus?: boolean;
		disabled?: boolean;
	}>(),
	{
		languageField: () => null,
		value: () => [],
		autofocus: false,
		disabled: false,
	}
);

const emit = defineEmits(['input']);

const value = computed({
	get: () => props.value,
	set: (val) => {
		emit('input', val);
	},
});

const { collection, field, primaryKey } = toRefs(props);
const { relationInfo } = useRelationM2M(collection, field);
const { t } = useI18n();

const fieldsStore = useFieldsStore();
const userStore = useUserStore();

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

const { create, update, displayItems, loading, fetchedItems } = useRelationMultiple(
	value,
	query,
	relationInfo,
	primaryKey
);

const firstItem = computed(() => getItemWithLang(displayItems.value, firstLang.value));
const secondItem = computed(() => getItemWithLang(displayItems.value, secondLang.value));
const firstItemInitial = computed(() => getItemWithLang(fetchedItems.value, firstLang.value));
const secondItemInitial = computed(() => getItemWithLang(fetchedItems.value, secondLang.value));

function getItemWithLang<T extends Record<string, any>>(items: T[], lang: string | undefined) {
	const langField = relationInfo.value?.junctionField.field;
	const relatedPKField = relationInfo.value?.relatedPrimaryKeyField.field;
	if (!langField || !relatedPKField || !lang) return;

	return items.find((item) => item[langField][relatedPKField] === lang);
}

function updateValue(item: DisplayItem, lang: string | undefined) {
	const info = relationInfo.value;
	if (!info) return;

	const itemInfo = getItemWithLang(displayItems.value, lang);

	if (itemInfo) {
		update({
			...item,
			$type: itemInfo?.$type,
			$index: itemInfo?.$index,
		});
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

			const filledFields = writableFields.filter((field) => notEmpty((edits ?? {})[field.field])).length;

			return {
				text: language[props.languageField ?? relationInfo.value.relatedPrimaryKeyField.field],
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

			languages.value = response.data.data;

			if (!firstLang.value) {
				const userLang = languages.value.find(
					(lang) =>
						userStore.currentUser &&
						'language' in userStore.currentUser &&
						lang[pkField] === userStore.currentUser.language
				)?.[pkField];

				firstLang.value = userLang || languages.value[0][pkField];
			}

			if (!secondLang.value) {
				secondLang.value = languages.value[1][pkField];
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
		--v-divider-color: var(--primary-50);
	}

	.secondary {
		--v-divider-color: var(--secondary-50);

		.v-form {
			--primary: var(--secondary);
			--v-chip-color: var(--secondary);
			--v-chip-background-color: var(--secondary-alt);
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
