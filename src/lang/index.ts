import Vue from 'vue';
import VueI18n from 'vue-i18n';
import debug from 'debug';
import { merge } from 'lodash';

import enUSBase from './en-US/index.json';
import enUSInterfaces from './en-US/interfaces.json';
import enUSLayouts from './en-US/layouts.json';
import dateTimeFormats from './en-US/date-format.json';

/* istanbul ignore next */
const log = debug('directus:i18n');

Vue.use(VueI18n);

export const i18n = new VueI18n({
	locale: 'en-US',
	fallbackLocale: 'en-US',
	messages: {
		'en-US': merge(enUSBase, enUSInterfaces, enUSLayouts)
	},
	dateTimeFormats: {
		'en-US': dateTimeFormats
	},
	silentTranslationWarn: true
});

export const availableLanguages = {
	'af-ZA': 'Afrikaans (South Africa)',
	'ar-SA': 'Arabic (Saudi Arabia)',
	'ca-ES': 'Catalan (Spain)',
	'zh-CN': 'Chinese (Simplified)',
	'cs-CZ': 'Czech (Czech Republic)',
	'da-DK': 'Danish (Denmark)',
	'nl-NL': 'Dutch (Netherlands)',
	'en-US': 'English (United States)',
	'fi-FI': 'Finnish (Finland)',
	'fr-FR': 'French (France)',
	'de-DE': 'German (Germany)',
	'el-GR': 'Greek (Greece)',
	'he-IL': 'Hebrew (Israel)',
	'hu-HU': 'Hungarian (Hungary)',
	'is-IS': 'Icelandic (Iceland)',
	'id-ID': 'Indonesian (Indonesia)',
	'it-IT': 'Italian (Italy)',
	'ja-JP': 'Japanese (Japan)',
	'ko-KR': 'Korean (Korea)',
	'ms-MY': 'Malay (Malaysia)',
	'no-NO': 'Norwegian (Norway)',
	'pl-PL': 'Polish (Poland)',
	'pt-BR': 'Portuguese (Brazil)',
	'pt-PT': 'Portuguese (Portugal)',
	'ru-RU': 'Russian (Russian Federation)',
	'es-ES': 'Spanish (Spain)',
	'es-419': 'Spanish (Latin America)',
	'zh-TW': 'Taiwanese Mandarin (Taiwan)',
	'tr-TR': 'Turkish (Turkey)',
	'uk-UA': 'Ukrainian (Ukraine)',
	'vi-VN': 'Vietnamese (Vietnam)'
};

export type Language = keyof typeof availableLanguages;

export const loadedLanguages: Language[] = ['en-US'];

export async function setLanguage(lang: Language): Promise<boolean> {
	log(`[setCurrentLanguage] Setting language to "${lang}"`);

	if (Object.keys(availableLanguages).includes(lang) === false) {
		log(`[setCurrentLanguage] ❌ "${lang}" is not an available language. Exiting.`);
		return false;
	}

	if (i18n.locale === lang) {
		log(`[setCurrentLanguage] ❌ Language "${lang}" is current language. Exiting.`);
		return true;
	}

	if (loadedLanguages.includes(lang) === false) {
		log(`[setCurrentLanguage] Fetching messages for "${lang}"...`);

		const translations = await Promise.all([
			import(`@/lang/${lang}/index.json`),
			import(`@/lang/${lang}/interfaces.json`),
			import(`@/lang/${lang}/layouts.json`)
		]);

		translations.forEach(msgs => i18n.mergeLocaleMessage(lang, msgs));
		loadedLanguages.push(lang);
		log(`[setCurrentLanguage] Language "${lang}" fetched and merged.`);

		// The date-format json file may or may not exist, as it's not handled by Crowdin.
		// If it doesn't exist, i18n will fall back to en-US as default
		// istanbul ignore next catch
		try {
			log(`[setCurrentLanguage] Fetch date time formats for "${lang}"`);
			const dateTimeFormats = await import(`@/lang/${lang}/date-format.json`);
			i18n.setDateTimeFormat(lang, dateTimeFormats);

			log(`[setCurrentLanguage] Date formats for "${lang}" fetched and merged.`);
		} catch {
			log(`[setCurrentLanguage] ❌ Couldn't fetch date time formats for language "${lang}"`);
		}
	}

	i18n.locale = lang;
	document.querySelector('html')!.setAttribute('lang', lang);

	log(`[setCurrentLanguage] ✅ Set current language to "${lang}". Exiting.`);

	return true;
}

export default i18n;
