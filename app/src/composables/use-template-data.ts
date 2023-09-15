import api from '@/api';
import { Collection } from '@/types/collections';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { getFieldsForTranslations } from '@/utils/get-fields-for-translations';
import { get, getEndpoint, getFieldsFromTemplate } from '@directus/utils';
import { cloneDeep, set } from 'lodash';
import { Ref, computed, ref, watch } from 'vue';

type UsableTemplateData = {
	templateData: Ref<Record<string, any> | undefined>;
	loading: Ref<boolean>;
	fetchTemplateValues: () => Promise<void>;
	error: Ref<any>;
	languageOptions: Ref<string[]>;
};

export function useTemplateData(
	collection: Ref<Collection | null>,
	primaryKey: Ref<string>,
	template?: Ref<string>,
	language?: Ref<string>
): UsableTemplateData {
	const _templateData = ref<Record<string, any>>();
	const loading = ref(false);
	const error = ref<any>(null);

	const templateFields = computed(() => {
		const _template = template?.value || collection.value?.meta?.display_template;

		if (!_template) return [];

		return getFieldsFromTemplate(_template);
	});

	const translationsFields = computed(() => {
		if (!collection.value) return [];

		return getFieldsForTranslations(templateFields.value, collection.value?.collection)
	});

	const fields = computed(() => {
		if (!collection.value) return [];

		const fields = adjustFieldsForDisplays(templateFields.value, collection.value?.collection);

		return [...fields, ...translationsFields.value];
	});

	const templateData = computed(() => {
		if (!collection.value) return undefined;

		const data = _templateData.value;

		if (!data) return undefined;

		if (translationsFields.value.length > 0 && language?.value) {
			return reduceTranslations(data, language.value);
		}

		return data;
	});

	const isSingleton = computed(() => !!collection.value?.meta?.singleton);

	const languageOptions = computed(() => {
		const options = new Set<string>()

		if (!_templateData.value) return [];

		for (const translationField of translationsFields.value) {
			const keys = get(_templateData.value, translationField, [])

			for (const key of keys) {
				options.add(key)
			}
		}

		return Array.from(options);
	})

	watch([collection, primaryKey], fetchTemplateValues, { immediate: true });

	return { templateData, loading, error, languageOptions, fetchTemplateValues };

	async function fetchTemplateValues() {
		if (
			(!primaryKey.value && !isSingleton.value) ||
			primaryKey.value === '+' ||
			fields.value === null ||
			!collection.value
		) {
			return;
		}

		loading.value = true;

		const baseEndpoint = getEndpoint(collection.value.collection);

		let endpoint: string;

		if (isSingleton.value) {
			endpoint = baseEndpoint;
		} else {
			endpoint = collection.value.collection.startsWith('directus_')
				? `${baseEndpoint}/${primaryKey.value}`
				: `${baseEndpoint}/${encodeURIComponent(primaryKey.value)}`;
		}

		try {
			const result = await api.get(endpoint, {
				params: {
					fields: fields.value,
				},
			});

			_templateData.value = result.data.data;
		} catch (err: any) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}

	/**
	 * Will reduce any translation array to a single object matching the selected language
	 * @example
	 * reduceTranslations({ id: 1, translations: [
	 * 	{ languages_code: { code: 'en' }, title: 'English' },
	 * 	{ languages_code: { code: 'de' }, title: 'German' }
	 * ] }, 'en')
	 * Returns: { id: 1, translations: { languages_code: { code: 'en' }, title: 'English' } }
	 * @param data The data to reduce
	 * @param language The language to reduce to
	 * @returns The reduced data
	 */
	function reduceTranslations(data: Record<string, any>, language: string) {
		data = cloneDeep(data);

		for (const translationField of translationsFields.value) {
			const parts = translationField.split('.');

			const translationFieldRoot = parts.slice(0, -2).join('.');
			const translationFieldTail = parts.slice(-2).join('.');

			const translationFieldData = get(data, translationFieldRoot);

			if (!translationFieldData || !Array.isArray(translationFieldData)) continue;

			set(data, translationFieldRoot, translationFieldData.find((item: any) => get(item, translationFieldTail) === language));
		}

		return data;

	}
}
