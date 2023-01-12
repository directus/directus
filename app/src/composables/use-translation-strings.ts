import { ref, Ref, computed, ComputedRef } from 'vue';
import { getLiteralInterpolatedTranslation } from '@/utils/get-literal-interpolated-translation';
import { unexpectedError } from '@/utils/unexpected-error';
import { Language, i18n } from '@/lang';
import { useUserStore } from '@/stores/user';
import { useSettingsStore } from '@/stores/settings';
import api from '@/api';
import { sortBy } from 'lodash';

export type Translation = {
	language: string;
	translation: string;
};
export type RawTranslation = {
	key: string;
	value: string;
	lang: Language;
};

export type DisplayTranslationString = {
	key?: string | null;
	translations?: Translation[] | null;
};

type UsableTranslationStrings = {
	loading: Ref<boolean>;
	error: Ref<any>;
	translationKeys: ComputedRef<string[] | null>;
	translationStrings: Ref<RawTranslation[] | null>;
	displayTranslationStrings: ComputedRef<DisplayTranslationString[] | null>;
	loadLanguageTranslationStrings: (lang: Language) => Promise<void>;
	fetchAllTranslationStrings: () => Promise<RawTranslation[]>;
	refresh: () => Promise<void>;
	updating: Ref<boolean>;

	addTranslation: (translation: DisplayTranslationString) => void;
	updateTranslation: (originalKey: string, translation: DisplayTranslationString) => void;
	removeTranslation: (translationKey: string) => void;

	// update: (newTranslationStrings: DisplayTranslationString[]) => Promise<void>;
};

let loading: Ref<boolean> | null = null;
let translationStrings: Ref<RawTranslation[] | null> | null = null;
let error: Ref<any> | null = null;

export function useTranslationStrings(): UsableTranslationStrings {
	if (loading === null) loading = ref(false);
	if (error === null) error = ref(null);
	if (translationStrings === null) translationStrings = ref<RawTranslation[] | null>(null);
	const updating = ref(false);
	const usersStore = useUserStore();

	const translationKeys = computed(() => {
		if (!translationStrings || !translationStrings.value) return [];
		return Array.from(new Set(translationStrings.value.map(({ key }) => key))).sort();
	});
	const displayTranslationStrings = computed(() => {
		if (!translationStrings || !translationStrings.value) return [];
		const translationObject = translationStrings.value.reduce(
			(acc: Record<string, Translation[]>, { key, value, lang }: RawTranslation) => {
				if (!acc[key]) acc[key] = [];
				acc[key].push({ language: lang, translation: value });
				return acc;
			},
			{} as Record<string, Translation[]>
		);
		return Object.entries(translationObject).map(
			([key, translations]) => ({ key, translations } as DisplayTranslationString)
		);
	});

	return {
		loading,
		error,
		translationKeys,
		translationStrings,
		displayTranslationStrings,
		loadLanguageTranslationStrings,
		fetchAllTranslationStrings,
		refresh,
		updating,
		addTranslation,
		updateTranslation,
		removeTranslation,
	};

	async function loadLanguageTranslationStrings(lang: Language) {
		if (loading === null) return;
		if (translationStrings === null) return;
		if (error === null) return;
		// const t0 = performance.now();
		const translations = await fetchTranslationStrings(lang);
		// const t1 = performance.now();
		const localeMessages: Record<string, any> = translations.reduce(
			(result: Record<string, string>, { key, value }: { key: string; value: string }) => {
				result[key] = getLiteralInterpolatedTranslation(value, true);
				return result;
			},
			{} as Record<string, string>
		);
		i18n.global.mergeLocaleMessage(lang, localeMessages);
		translationStrings.value = translations;
		// const t2 = performance.now();
		// console.log(`translations lang ${lang} - request ${t1 - t0}ms - transform ${t2 - t1}ms`);
	}

	async function refresh() {
		if (loading === null) return;
		if (translationStrings === null) return;
		if (error === null) return;

		loading.value = false;
		error.value = null;

		try {
			const language =
				usersStore.currentUser && 'language' in usersStore.currentUser ? usersStore.currentUser.language : 'en-US';
			const rawTranslationStrings = await fetchTranslationStrings(language);

			if (rawTranslationStrings) {
				translationStrings.value = rawTranslationStrings;
			}
		} catch (err: any) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}

	async function addTranslation(translation: DisplayTranslationString) {
		// console.log('addTranslation', translation);
		if (!translation.key || !translation.translations) return;
		if (!translationKeys.value || !translationStrings || !translationStrings.value) {
			return;
		}
		if (translationKeys.value.includes(translation.key)) {
			unexpectedError(new Error('translation key already exists!'));
			return;
		}
		for (const { language: lang, translation: value } of translation.translations) {
			translationStrings.value.push({ key: translation.key, lang, value });
		}
		await updateStrings(translationStrings.value);
	}
	async function removeTranslation(translationKey: string) {
		// console.log('removeTranslation', translationKey);
		if (!translationKeys.value || !translationStrings || !translationStrings.value) {
			return;
		}
		if (translationKeys.value.includes(translationKey)) {
			translationStrings.value = translationStrings.value.filter(({ key }) => key !== translationKey);
		}
		await updateStrings(translationStrings.value);
	}
	async function updateTranslation(originalKey: string, translation: DisplayTranslationString) {
		// console.log('updateTranslation', translation);
		if (!translation.key || !translation.translations) return;
		if (!translationKeys.value || !translationStrings || !translationStrings.value) {
			return;
		}
		if (translationKeys.value.includes(originalKey)) {
			translationStrings.value = translationStrings.value.filter(({ key }) => key !== originalKey);
		}
		for (const { language: lang, translation: value } of translation.translations) {
			translationStrings.value.push({ key: translation.key, lang, value });
		}
		await updateStrings(translationStrings.value);
	}

	async function updateStrings(strings: RawTranslation[]) {
		updating.value = true;
		try {
			const settingsStore = useSettingsStore();
			await settingsStore.updateSettings({ translation_strings: strings }, false);
			const { currentUser } = useUserStore();
			const language =
				currentUser && 'language' in currentUser && currentUser.language ? currentUser.language : 'en-US';
			const localeMessages: Record<string, any> = strings
				.filter(({ lang }) => lang === language)
				.reduce((result: Record<string, string>, { key, value }: { key: string; value: string }) => {
					result[key] = getLiteralInterpolatedTranslation(value, true);
					return result;
				}, {} as Record<string, string>);
			i18n.global.mergeLocaleMessage(language, localeMessages);
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			updating.value = false;
		}
	}
	async function fetchTranslationStrings(lang: Language): Promise<RawTranslation[]> {
		const response = await api.get(`/settings`, {
			params: {
				fields: ['translations'],
				alias: {
					translations: 'json(translation_strings$[*])',
				},
				deep: {
					translations: {
						_filter: {
							'$.lang': { _eq: lang },
						},
					},
				},
			},
		});
		return (response.data.data.translations ?? []) as RawTranslation[];
	}

	async function fetchAllTranslationStrings() {
		const response = await api.get(`/settings`, {
			params: { fields: ['translation_strings'] },
		});
		return response.data.data?.translation_strings ?? [];
	}

	// function mergeTranslationStringsForLanguage(lang: Language) {
	// 	if (!translationStrings?.value) return;
	// 	const localeMessages: Record<string, any> = translationStrings.value.reduce((acc, cur) => {
	// 		if (!cur.key || !cur.translations) return acc;
	// 		const translationForCurrentLang = cur.translations.find((t) => t.language === lang);
	// 		if (!translationForCurrentLang || !translationForCurrentLang.translation) return acc;
	// 		return { ...acc, [cur.key]: getLiteralInterpolatedTranslation(translationForCurrentLang.translation, true) };
	// 	}, {});
	// 	i18n.global.mergeLocaleMessage(lang, localeMessages);
	// }

	// function getUniqueTranslationStrings(arr: TranslationString[]): TranslationString[] {
	// 	return [...new Map(arr.map((item: TranslationString) => [item.key, item])).values()];
	// }

	// function getKeyValuesFromTranslations(val: TranslationString['translations'] | null): Record<string, string> {
	// 	if (!val || (val && val.length === 0)) return {};

	// 	return val.reduce((acc, cur) => {
	// 		return { ...acc, [cur.language]: cur.translation };
	// 	}, {});
	// }

	// function getTranslationsFromKeyValues(val: Record<string, string> | null): TranslationString['translations'] {
	// 	if (!val || Object.keys(val).length === 0) return [];

	// 	return Object.entries(val).map(([k, v]) => ({ language: k, translation: v }));
	// }
}
