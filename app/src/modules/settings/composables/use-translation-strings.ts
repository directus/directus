import { ref, Ref } from 'vue';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';

export type TranslationString = {
	key?: string | null;
	translations?: Record<string, string>[] | null;
};

type UsableTranslationStrings = {
	loading: Ref<boolean>;
	error: Ref<any>;
	translationStrings: Ref<TranslationString[] | null>;
	refresh: () => void;
	saving: Ref<boolean>;
	save: (newTranslationStrings?: TranslationString[]) => Promise<void>;
};

let loading: Ref<boolean> | null = null;
let translationStrings: Ref<TranslationString[] | null> | null = null;
let error: Ref<any> | null = null;

export function useTranslationStrings(): UsableTranslationStrings {
	if (loading === null) loading = ref(false);
	if (error === null) error = ref(null);
	if (translationStrings === null) translationStrings = ref<TranslationString[] | null>(null);
	const saving = ref(false);

	if (!translationStrings.value) {
		fetchTranslationStrings();
	}

	if (translationStrings.value === null && loading.value === false) {
		fetchTranslationStrings();
	}

	return { loading, error, translationStrings, refresh, saving, save };

	async function fetchTranslationStrings() {
		if (loading === null) return;
		if (translationStrings === null) return;
		if (error === null) return;

		loading.value = true;
		error.value = null;

		try {
			const response = await api.get('/settings', {
				params: {
					fields: ['translation_strings'],
				},
			});

			const { translation_strings } = response.data.data;

			if (translation_strings) {
				translationStrings.value = translation_strings;
			}
		} catch (err: any) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}

	function refresh() {
		if (loading === null) return;
		if (translationStrings === null) return;
		if (error === null) return;

		loading.value = false;
		error.value = null;

		fetchTranslationStrings();
	}

	async function save(newTranslationStrings?: TranslationString[]) {
		if (loading === null) return;
		if (translationStrings === null) return;
		if (error === null) return;

		saving.value = true;

		let payload: TranslationString[] = [];

		if (newTranslationStrings) {
			payload = getUniqueTranslationStrings([...(translationStrings.value ?? []), ...newTranslationStrings]);
		}

		try {
			const settingsResponse = await api.patch('/settings', {
				translation_strings: payload,
			});
			if (settingsResponse.data.data.translation_strings) {
				translationStrings.value = settingsResponse.data.data.translation_strings;
			}
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			saving.value = false;
		}

		function getUniqueTranslationStrings(arr: TranslationString[]) {
			return [...new Map(arr.map((item) => [item.key, item])).values()];
		}
	}
}
