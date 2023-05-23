import { ref, Ref, computed, ComputedRef, watch } from 'vue';
import { getLiteralInterpolatedTranslation } from '@/utils/get-literal-interpolated-translation';
import { unexpectedError } from '@/utils/unexpected-error';
import { Language, i18n } from '@/lang';
import { useUserStore } from '@/stores/user';
import api from '@/api';
import { debounce } from 'lodash';

export type Translation = {
	language: string;
	translation: string;
};
export type RawTranslation = {
	key: string;
	value: string;
	language: Language;
};

export type DisplayTranslationString = {
	key?: string | null;
	translations?: Translation[] | null;
};

type UsableTranslationStrings = {
	loading: Ref<boolean>;
	error: Ref<any>;
	translationMap: ComputedRef<Record<string, Translation[]>>;
	translationKeys: ComputedRef<string[] | null>;
	translationStrings: Ref<RawTranslation[] | null>;
	displayTranslationStrings: ComputedRef<DisplayTranslationString[] | null>;

	loadLanguageTranslationStrings: (lang: Language) => Promise<void>;
	loadAllTranslations: () => Promise<void>;
	refresh: () => Promise<void>;

	updating: Ref<boolean>;
	upsertTranslation: (translation: DisplayTranslationString) => Promise<void>;
	removeTranslation: (translationKey: string) => Promise<void>;
};

let loading: Ref<boolean> | null = null;
let translationStrings: Ref<RawTranslation[] | null> | null = null;
let error: Ref<any> | null = null;
let allLanguagesLoaded = false;

export function useTranslationStrings(search?: Ref<string>): UsableTranslationStrings {
	if (loading === null) loading = ref(false);
	if (error === null) error = ref(null);
	if (translationStrings === null) translationStrings = ref<RawTranslation[] | null>(null);
	const updating = ref(false);
	const internalSearch = ref('');
	const usersStore = useUserStore();

	if (search) {
		watch(
			search,
			debounce((val: string) => {
				internalSearch.value = val;
			}, 250)
		);
	}

	const filteredStrings = computed(() => {
		if (internalSearch.value && translationStrings?.value) {
			return translationStrings.value.filter(({ key, value, language }) => {
				return (
					key.includes(internalSearch.value) ||
					value.includes(internalSearch.value) ||
					language.includes(internalSearch.value)
				);
			});
		}

		return translationStrings?.value ?? [];
	});

	const translationKeys = computed(() => {
		if (!filteredStrings.value) return [];
		return Array.from(new Set(filteredStrings.value.map(({ key }) => key))).sort();
	});

	const translationMap = computed(() => {
		const result: Record<string, Translation[]> = {};

		if (filteredStrings.value) {
			for (const { key, value, language } of filteredStrings.value) {
				if (!(key in result)) result[key] = [];
				result[key].push({ language, translation: value } as Translation);
			}
		}

		return result;
	});

	const displayTranslationStrings = computed(() => {
		if (!filteredStrings.value) return [];

		const translationObject = filteredStrings.value.reduce(
			(acc: Record<string, Translation[]>, { key, value, language }: RawTranslation) => {
				if (!acc[key]) acc[key] = [];
				acc[key].push({ language, translation: value });
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
		translationMap,
		translationKeys,
		translationStrings,
		displayTranslationStrings,
		loadLanguageTranslationStrings,
		loadAllTranslations,
		refresh,
		updating,
		upsertTranslation,
		removeTranslation,
	};

	async function loadLanguageTranslationStrings(lang: Language) {
		if (loading === null) return;
		if (translationStrings === null) return;
		if (error === null) return;

		let translations;

		if (!allLanguagesLoaded) {
			translations = await fetchTranslationStrings(lang);
			translationStrings.value = translations;
		} else {
			translations = (translationStrings.value ?? []).filter((item) => item.language === lang);
		}

		const localeMessages: Record<string, any> = translations.reduce(
			(result: Record<string, string>, { key, value }: { key: string; value: string }) => {
				result[key] = getLiteralInterpolatedTranslation(value, true);
				return result;
			},
			{} as Record<string, string>
		);

		i18n.global.mergeLocaleMessage(lang, localeMessages);
	}

	async function refresh() {
		if (loading === null) return;
		if (translationStrings === null) return;
		if (error === null) return;

		loading.value = true;
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

	async function upsertTranslation(translation: DisplayTranslationString) {
		if (!translation.key || !translation.translations) return;

		if (!translationKeys.value || !translationStrings || !translationStrings.value) {
			return;
		}

		const newTranslations: RawTranslation[] = [];

		for (const { language, translation: value } of translation.translations) {
			newTranslations.push({ key: translation.key, language, value });
		}

		await api.post(`/translation-strings/${encodeURIComponent(translation.key)}`, newTranslations);

		translationStrings.value = translationStrings.value
			.filter(({ key }) => key !== translation.key)
			.concat(newTranslations);

		await updateLocaleStrings(translationStrings.value);
	}

	async function removeTranslation(translationKey: string) {
		if (!translationKeys.value || !translationStrings || !translationStrings.value) {
			return;
		}

		if (translationKeys.value.includes(translationKey)) {
			translationStrings.value = translationStrings.value.filter(({ key }) => key !== translationKey);
			await api.delete(`/translation-strings/${encodeURIComponent(translationKey)}`);
			await updateLocaleStrings(translationStrings.value);
		}
	}

	async function updateLocaleStrings(strings: RawTranslation[]) {
		updating.value = true;

		try {
			const { currentUser } = useUserStore();

			const language =
				currentUser && 'language' in currentUser && currentUser.language ? currentUser.language : 'en-US';

			const localeMessages: Record<string, any> = strings
				.filter(({ language: lang }) => lang === language)
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
		const response = await api.get(`/translation-strings`, {
			params: {
				fields: ['language', 'key', 'value'],
				filter: {
					language: { _eq: lang },
				},
				limit: -1,
			},
		});

		return response.data.data ?? [];
	}

	async function fetchAllTranslationStrings(): Promise<RawTranslation[]> {
		const response = await api.get(`/translation-strings`, {
			params: { fields: ['language', 'key', 'value'], limit: -1 },
		});

		return response.data.data ?? [];
	}

	async function loadAllTranslations(): Promise<void> {
		if (loading === null) return;
		if (translationStrings === null) return;
		if (error === null) return;
		if (allLanguagesLoaded === true) return;
		loading.value = true;

		try {
			const strings = await fetchAllTranslationStrings();
			translationStrings.value = strings;
			allLanguagesLoaded = true;
		} catch (err: any) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}
}
