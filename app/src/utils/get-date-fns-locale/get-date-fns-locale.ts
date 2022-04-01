import { i18n } from '@/lang';
import { Locale } from 'date-fns';

import importDateLocale from './import-date-locale';

export async function getDateFNSLocale(): Promise<Locale> {
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

	return locale;
}
