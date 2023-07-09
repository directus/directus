import api from '@/api';
import { i18n } from '@/lang';
import { fetchAll } from '@/utils/fetch-all';
import { getLiteralInterpolatedTranslation } from '@/utils/get-literal-interpolated-translation';
import { unexpectedError } from '@/utils/unexpected-error';
import { defineStore } from 'pinia';
import { ref, unref, watch } from 'vue';

export interface Translation {
	language: string;
	key: string;
	value: string;
}

export const useTranslationsStore = defineStore('translations', () => {
	const loading = ref(false);
	const translations = ref<Translation[]>([]);
	const lang = ref<string>('en-US');

	const loadTranslations = async (newLang = unref(lang)) => {
		loading.value = true;

		try {
			translations.value = await fetchAll(`/translations`, {
				params: {
					fields: ['language', 'key', 'value'],
					filter: {
						language: { _eq: newLang },
					},
				},
			});

			lang.value = newLang;
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			loading.value = false;
		}
	};

	const create = async (translation: Translation) => {
		try {
			await api.post('/translations', translation);
			await loadTranslations();
		} catch (err: any) {
			unexpectedError(err);
		}
	};

	watch(translations, (newTranslations) => {
		const localeMessages = newTranslations?.reduce(
			(result: Record<string, string>, { key, value }: { key: string; value: string }) => {
				result[key] = getLiteralInterpolatedTranslation(value, true);
				return result;
			},
			{} as Record<string, string>
		);

		if (localeMessages) {
			i18n.global.mergeLocaleMessage(unref(lang), localeMessages);
		}
	});

	return { loading, translations, loadTranslations, create };
});
