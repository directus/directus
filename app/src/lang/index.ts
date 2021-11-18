import { RequestError } from '@/api';
import { createI18n } from 'vue-i18n';
import availableLanguages from './available-languages.yaml';
import datetimeFormats from './date-formats.yaml';
import numberFormats from './number-formats.yaml';
import enUSBase from './translations/en-US.yaml';
import arSABase from './translations/ar-SA.yaml';

export const i18n = createI18n({
	legacy: false,
	locale: 'ar-SA',
	fallbackLocale: 'ar-SA',
	messages: {
		'ar-SA': arSABase,
		//'en-US': enUSBase,
	},
	silentTranslationWarn: true,
	datetimeFormats,
	numberFormats,
});

export type Language = keyof typeof availableLanguages;

export const loadedLanguages: Language[] = ['ar-SA'];

export function translateAPIError(error: RequestError | string): string {
	const defaultMsg = i18n.global.t('unexpected_error');

	let code = error;

	if (typeof error === 'object') {
		code = error?.response?.data?.errors?.[0]?.extensions?.code;
	}

	if (!error) return defaultMsg;
	if (!code === undefined) return defaultMsg;
	const key = `errors.${code}`;

	const exists = i18n.global.te(key);
	if (exists === false) return defaultMsg;
	return i18n.global.t(key);
}
