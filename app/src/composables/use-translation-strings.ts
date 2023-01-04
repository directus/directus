import { ref, Ref } from 'vue';
import { getLiteralInterpolatedTranslation } from '@/utils/get-literal-interpolated-translation';
import { unexpectedError } from '@/utils/unexpected-error';
import { Language, i18n } from '@/lang';
import { useUserStore } from '@/stores/user';
import { useSettingsStore } from '@/stores/settings';

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
	loadParsedTranslationStrings: () => void;
	refresh: () => Promise<void>;
	updating: Ref<boolean>;
	update: (newTranslationStrings: TranslationString[]) => Promise<void>;
	mergeTranslationStringsForLanguage: (lang: Language) => void;
};

let loading: Ref<boolean> | null = null;
let translationStrings: Ref<TranslationString[] | null> | null = null;
let error: Ref<any> | null = null;

export function useTranslationStrings(): UsableTranslationStrings {
	if (loading === null) loading = ref(false);
	if (error === null) error = ref(null);
	if (translationStrings === null) translationStrings = ref<TranslationString[] | null>(null);
	const updating = ref(false);

	return {
		loading,
		error,
		translationStrings,
		loadParsedTranslationStrings,
		refresh,
		updating,
		update,
		mergeTranslationStringsForLanguage,
	};

	function loadParsedTranslationStrings() {
		if (loading === null) return;
		if (translationStrings === null) return;
		if (error === null) return;

		const settingsStore = useSettingsStore();
		const rawTranslationStrings = settingsStore.settings?.translation_strings;

		if (rawTranslationStrings) {
			translationStrings.value = rawTranslationStrings.map((p: TranslationStringRaw) => ({
				key: p.key,
				translations: getTranslationsFromKeyValues(p.translations ?? null),
			}));
		}
	}

	async function refresh() {
		if (loading === null) return;
		if (translationStrings === null) return;
		if (error === null) return;

		loading.value = false;
		error.value = null;

		try {
			const settingsStore = useSettingsStore();
			const rawTranslationStrings = await settingsStore.fetchRawTranslationStrings();

			if (rawTranslationStrings) {
				translationStrings.value = rawTranslationStrings.map((p: TranslationStringRaw) => ({
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
			const settingsStore = useSettingsStore();
			await settingsStore.updateSettings({ translation_strings: payload }, false);
			if (settingsStore.settings?.translation_strings) {
				translationStrings.value = settingsStore.settings.translation_strings.map((p: TranslationStringRaw) => ({
					key: p.key,
					translations: getTranslationsFromKeyValues(p.translations ?? null),
				}));

				const { currentUser } = useUserStore();
				if (currentUser && 'language' in currentUser && currentUser.language) {
					mergeTranslationStringsForLanguage(currentUser.language);
				} else {
					mergeTranslationStringsForLanguage('en-US');
				}
			}
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			updating.value = false;
		}
	}

	function mergeTranslationStringsForLanguage(lang: Language) {
		if (!translationStrings?.value) return;
		const localeMessages: Record<string, any> = translationStrings.value.reduce((acc, cur) => {
			if (!cur.key || !cur.translations) return acc;
			const translationForCurrentLang = cur.translations.find((t) => t.language === lang);
			if (!translationForCurrentLang || !translationForCurrentLang.translation) return acc;
			return { ...acc, [cur.key]: getLiteralInterpolatedTranslation(translationForCurrentLang.translation, true) };
		}, {});
		i18n.global.mergeLocaleMessage(lang, localeMessages);
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
