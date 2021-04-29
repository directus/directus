import { i18n } from '@/lang';
import { Locale } from 'date-fns';

export async function getDateFNSLocale(): Promise<Locale> {
	const lang = i18n.global.locale.value;

	const localesToTry = [lang, lang.split('-')[0], 'en-US'];

	let locale;

	for (const l of localesToTry) {
		try {
			// @TODO3 Investigate manual chunking
			const mod = await import(`@vite-module!date-fns/locale/${l}/index.js`);

			locale = mod.default;
			break;
		} catch {
			continue;
		}
	}

	return locale;
}
