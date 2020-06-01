import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { merge } from 'lodash';
import { RequestError } from '@/api';

import enUSBase from './en-US/index.json';
import enUSInterfaces from './en-US/interfaces.json';
import enUSDisplays from './en-US/displays.json';
import enUSLayouts from './en-US/layouts.json';
import defaultDateTimeFormats from './en-US/date-format.json';

Vue.use(VueI18n);

export const i18n = new VueI18n({
	locale: 'en-US',
	fallbackLocale: 'en-US',
	messages: {
		'en-US': merge(enUSBase, enUSInterfaces, enUSDisplays, enUSLayouts),
	},
	dateTimeFormats: {
		'en-US': defaultDateTimeFormats,
	},
	silentTranslationWarn: true,
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
	'vi-VN': 'Vietnamese (Vietnam)',
};

export type Language = keyof typeof availableLanguages;

export const loadedLanguages: Language[] = ['en-US'];

export async function setLanguage(lang: Language): Promise<boolean> {
	if (Object.keys(availableLanguages).includes(lang) === false) {
		return false;
	}

	if (i18n.locale === lang) {
		return true;
	}

	if (loadedLanguages.includes(lang) === false) {
		const translations = await Promise.all([
			import(`@/lang/${lang}/index.json`),
			import(`@/lang/${lang}/interfaces.json`),
			import(`@/lang/${lang}/displays.json`),
			import(`@/lang/${lang}/layouts.json`),
		]);

		translations.forEach((msgs) => i18n.mergeLocaleMessage(lang, msgs));
		loadedLanguages.push(lang);

		// The date-format json file may or may not exist, as it's not handled by Crowdin.
		// If it doesn't exist, i18n will fall back to en-US as default
		// istanbul ignore next catch
		try {
			const dateTimeFormats = await import(`@/lang/${lang}/date-format.json`);
			i18n.setDateTimeFormat(lang, dateTimeFormats);
		} catch {
			console.log(`[setCurrentLanguage] ❌ Couldn't fetch date time formats for language "${lang}"`);
		}
	}

	i18n.locale = lang;
	(document.querySelector('html') as HTMLElement).setAttribute('lang', lang);

	return true;
}

export default i18n;

export function translateAPIError(error: RequestError | number) {
	const defaultMsg = i18n.t('unexpected_error');

	let code = error;

	if (typeof error === 'object') {
		code = error?.response?.data?.error?.code;
	}

	if (!error) return defaultMsg;
	if (!code === undefined) return defaultMsg;
	const key = `errors.${code}`;

	const exists = i18n.te(key);
	if (exists === false) return defaultMsg;
	return i18n.t(key);
}
