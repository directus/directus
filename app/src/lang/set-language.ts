import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import availableLanguages from './available-languages.yaml';
import { i18n, Language, loadedLanguages } from './index';
import { useTranslationStrings } from '@/composables/use-translation-strings';
import { loadDateFNSLocale } from '@/utils/get-date-fns-locale';

export async function setLanguage(lang: Language): Promise<boolean> {
	const collectionsStore = useCollectionsStore();
	const fieldsStore = useFieldsStore();
	const { mergeTranslationStringsForLanguage } = useTranslationStrings();

	if (Object.keys(availableLanguages).includes(lang) === false) {
		// eslint-disable-next-line no-console
		console.warn(`"${lang}" is not an available language in the Directus app.`);
	} else {
		if (loadedLanguages.includes(lang) === false) {
			try {
				const { default: translations } = await import(`./translations/${lang}.yaml`);
				i18n.global.mergeLocaleMessage(lang, translations);
				loadedLanguages.push(lang);
			} catch (err: any) {
				// eslint-disable-next-line no-console
				console.warn(err);
			}
		}

		i18n.global.locale.value = lang;

		(document.querySelector('html') as HTMLElement).setAttribute('lang', lang);
	}

	mergeTranslationStringsForLanguage(lang);
	collectionsStore.translateCollections();
	fieldsStore.translateFields();

	await loadDateFNSLocale(lang);

	return true;
}
