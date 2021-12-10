import { i18n } from '@/lang';

import importDateLocale from './import-flatpickr-locale';

export async function getFlatpickrLocale(): Promise<Record<string, any>> {
	const lang = i18n.global.locale.value;

	const localesToTry = [lang, lang.split('-')[0], 'en-US'];

	let locale;

	for (const l of localesToTry) {
		try {
			const mod = await importDateLocale(l);

			locale = mod.default;
			break;
		} catch {
			continue;
		}
	}

	// locale returns { default, en, <lang> } when not default and we'll only return the last value
	return 'firstDayOfWeek' in locale
		? locale
		: (Object.values(locale)[Object.keys(locale).length - 1] as Record<string, any>);
}
