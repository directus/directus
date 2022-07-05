import { i18n } from '@/lang';
import { Locale } from 'date-fns';

import importDateLocale from './import-date-locale';

const locales: { lang: string; locale: Locale }[] = [];

export function getDateFNSLocale(): Locale | undefined {
	const currentLang = i18n.global.locale.value;
	return locales.find(({ lang }) => currentLang === lang)?.locale;
}

export async function loadDateFNSLocale(lang: string) {
	const localesToTry = [lang, lang.split('-')[0], 'en-US'];

	let locale;

	for (const l of localesToTry) {
		try {
			const mod = await importDateLocale(l);
			locale = mod.default;
			locales.push({ lang, locale });
			break;
		} catch {
			continue;
		}
	}

	return locale;
}
