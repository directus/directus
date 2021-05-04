import { i18n } from '@/lang';

export async function getDateFNSLocale(): Promise<Locale> {
	const lang = i18n.locale;

	const localesToTry = [lang, lang.split('-')[0], 'en-US'];

	let locale;

	for (const l of localesToTry) {
		try {
			const mod = await import(
				/* webpackMode: 'lazy', webpackChunkName: 'df-[index]' */
				`date-fns/locale/${l}/index.js`
			);

			locale = mod.default;
			break;
		} catch {
			continue;
		}
	}

	return locale;
}
