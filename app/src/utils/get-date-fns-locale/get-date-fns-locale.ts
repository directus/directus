import { i18n } from '@/lang';

export async function getDateFNSLocale() {
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
