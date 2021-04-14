import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { RequestError } from '@/api';

import availableLanguages from './available-languages.yaml';

import enUSBase from './translations/en-US.yaml';
import dateFormats from './date-formats.yaml';

import { getModules } from '@/modules';
import { getLayouts } from '@/layouts';
import { getInterfaces } from '@/interfaces';
import { getDisplays } from '@/displays';
import { translate } from '@/utils/translate-object-values';

Vue.use(VueI18n);

const { modules, modulesRaw } = getModules();
const { layouts, layoutsRaw } = getLayouts();
const { interfaces, interfacesRaw } = getInterfaces();
const { displays, displaysRaw } = getDisplays();

export const i18n = new VueI18n({
	locale: 'en-US',
	fallbackLocale: 'en-US',
	messages: {
		'en-US': enUSBase,
	},
	dateTimeFormats: dateFormats,
	silentTranslationWarn: true,
});

export type Language = keyof typeof availableLanguages;

export const loadedLanguages: Language[] = ['en-US'];

export async function setLanguage(lang: Language): Promise<boolean> {
	if (Object.keys(availableLanguages).includes(lang) === false) {
		return false;
	}

	if (loadedLanguages.includes(lang) === false) {
		const translations = await import(`@/lang/translations/${lang}.yaml`).catch((err) => console.warn(err));
		i18n.mergeLocaleMessage(lang, translations);
		loadedLanguages.push(lang);
	}

	i18n.locale = lang;

	(document.querySelector('html') as HTMLElement).setAttribute('lang', lang);

	modules.value = translate(modulesRaw.value);
	layouts.value = translate(layoutsRaw.value);
	interfaces.value = translate(interfacesRaw.value);
	displays.value = translate(displaysRaw.value);

	return true;
}

export default i18n;

export function translateAPIError(error: RequestError | string) {
	const defaultMsg = i18n.t('unexpected_error');

	let code = error;

	if (typeof error === 'object') {
		code = error?.response?.data?.errors?.[0]?.extensions?.code;
	}

	if (!error) return defaultMsg;
	if (!code === undefined) return defaultMsg;
	const key = `errors.${code}`;

	const exists = i18n.te(key);
	if (exists === false) return defaultMsg;
	return i18n.t(key);
}
