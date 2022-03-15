import { ref, Ref } from 'vue';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';

export type Translation = {
	language: string;
	translation: string;
};

export type TranslationStringRaw = {
	key?: string | null;
	translations?: Record<string, string> | null;
};

export type TranslationString = {
	key?: string | null;
	translations?: Translation[] | null;
};

type UsableTranslationStrings = {
	loading: Ref<boolean>;
	error: Ref<any>;
	translationStrings: Ref<TranslationString[] | null>;
	refresh: () => void;
	updating: Ref<boolean>;
	update: (newTranslationStrings: TranslationString[]) => Promise<void>;
};

let loading: Ref<boolean> | null = null;
let translationStrings: Ref<TranslationString[] | null> | null = null;
let error: Ref<any> | null = null;

export function useTranslationStrings(): UsableTranslationStrings {
	if (loading === null) loading = ref(false);
	if (error === null) error = ref(null);
	if (translationStrings === null) translationStrings = ref<TranslationString[] | null>(null);
	const updating = ref(false);

	if (!translationStrings.value) {
		fetchTranslationStrings();
	}

	if (translationStrings.value === null && loading.value === false) {
		fetchTranslationStrings();
	}

	return { loading, error, translationStrings, refresh, updating, update };

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
				translationStrings.value = translation_strings.map((p: TranslationStringRaw) => ({
					key: p.key,
					translations: getTranslationsFromKeyValues(p.translations ?? null),
				}));
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

	async function update(newTranslationStrings: TranslationString[]) {
		if (loading === null) return;
		if (translationStrings === null) return;
		if (error === null) return;

		updating.value = true;

		const resultingTranslationStrings = getUniqueTranslationStrings([...newTranslationStrings]);

		const payload = resultingTranslationStrings.map((p: TranslationString) => ({
			key: p.key,
			translations: getKeyValuesFromTranslations(p.translations),
		}));

		try {
			const settingsResponse = await api.patch('/settings', {
				translation_strings: payload,
			});
			if (settingsResponse.data.data.translation_strings) {
				translationStrings.value = settingsResponse.data.data.translation_strings.map((p: TranslationStringRaw) => ({
					key: p.key,
					translations: getTranslationsFromKeyValues(p.translations ?? null),
				}));
			}
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			updating.value = false;
		}
	}

	function getUniqueTranslationStrings(arr: TranslationString[]): TranslationString[] {
		return [...new Map(arr.map((item: TranslationString) => [item.key, item])).values()];
	}

	function getKeyValuesFromTranslations(val: TranslationString['translations'] | null): Record<string, string> {
		if (!val || (val && val.length === 0)) return {};

		return val.reduce((acc, cur) => {
			return { ...acc, [cur.language]: cur.translation };
		}, {});
	}

	function getTranslationsFromKeyValues(val: Record<string, string> | null): TranslationString['translations'] {
		if (!val || Object.keys(val).length === 0) return [];

		return Object.entries(val).map(([k, v]) => ({ language: k, translation: v }));
	}
}
