import { ref, Ref, computed, ComputedRef } from 'vue';
import { getLiteralInterpolatedTranslation } from '@/utils/get-literal-interpolated-translation';
import { unexpectedError } from '@/utils/unexpected-error';
import { Language, i18n } from '@/lang';
import { useUserStore } from '@/stores/user';
import { useSettingsStore } from '@/stores/settings';
import api from '@/api';

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

		const translations = await fetchTranslationStrings(lang);
		const localeMessages: Record<string, any> = translations.reduce(
			(result: Record<string, string>, { key, value }: { key: string; value: string }) => {
				result[key] = getLiteralInterpolatedTranslation(value, true);
				return result;
			},
			{} as Record<string, string>
		);

		i18n.global.mergeLocaleMessage(lang, localeMessages);
		translationStrings.value = translations;
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
		await updateLocaleStrings(translationStrings.value);
	}
	async function removeTranslation(translationKey: string) {
		if (!translationKeys.value || !translationStrings || !translationStrings.value) {
			return;
		}
		if (translationKeys.value.includes(translationKey)) {
			translationStrings.value = translationStrings.value.filter(({ key }) => key !== translationKey);
		}
		await updateLocaleStrings(translationStrings.value);
	}
	async function updateTranslation(originalKey: string, translation: DisplayTranslationString) {
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
		await updateLocaleStrings(translationStrings.value);
	}

	async function updateLocaleStrings(strings: RawTranslation[]) {
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
		return response.data.data.translations ?? [];
	}

	async function fetchAllTranslationStrings(): Promise<RawTranslation[]> {
		const response = await api.get(`/settings`, {
			params: { fields: ['translation_strings'] },
		});
		return response.data.data?.translation_strings ?? [];
	}
}
