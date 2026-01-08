import type { Locale } from 'date-fns';
import { i18n } from '@/lang';

const locales: { lang: string; locale: Locale }[] = [];

export function getDateFNSLocale(): Locale | undefined {
	const currentLang = i18n.global.locale.value;
	return locales.find(({ lang }) => currentLang === lang)?.locale;
}

export async function loadDateFNSLocale(lang: string) {
	const localesToTry = [lang, (lang.split('-') as [string, string])[0], 'en-US'];

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

export function importDateLocale(locale: string): Promise<any> {
	switch (locale) {
		case 'af':
			return import('date-fns/locale/af');
		case 'ar-DZ':
			return import('date-fns/locale/ar-DZ');
		case 'ar-MA':
			return import('date-fns/locale/ar-MA');
		case 'ar-SA':
			return import('date-fns/locale/ar-SA');
		case 'az':
			return import('date-fns/locale/az');
		case 'be':
			return import('date-fns/locale/be');
		case 'bg':
			return import('date-fns/locale/bg');
		case 'bn':
			return import('date-fns/locale/bn');
		case 'ca':
			return import('date-fns/locale/ca');
		case 'cs':
			return import('date-fns/locale/cs');
		case 'cy':
			return import('date-fns/locale/cy');
		case 'da':
			return import('date-fns/locale/da');
		case 'de':
			return import('date-fns/locale/de');
		case 'de-AT':
			return import('date-fns/locale/de-AT');
		case 'el':
			return import('date-fns/locale/el');
		case 'en-AU':
			return import('date-fns/locale/en-AU');
		case 'en-CA':
			return import('date-fns/locale/en-CA');
		case 'en-GB':
			return import('date-fns/locale/en-GB');
		case 'en-IN':
			return import('date-fns/locale/en-IN');
		case 'en-NZ':
			return import('date-fns/locale/en-NZ');
		case 'en-US':
			return import('date-fns/locale/en-US');
		case 'en-ZA':
			return import('date-fns/locale/en-ZA');
		case 'eo':
			return import('date-fns/locale/eo');
		case 'es':
			return import('date-fns/locale/es');
		case 'et':
			return import('date-fns/locale/et');
		case 'eu':
			return import('date-fns/locale/eu');
		case 'fa-IR':
			return import('date-fns/locale/fa-IR');
		case 'fi':
			return import('date-fns/locale/fi');
		case 'fr':
			return import('date-fns/locale/fr');
		case 'fr-CA':
			return import('date-fns/locale/fr-CA');
		case 'fr-CH':
			return import('date-fns/locale/fr-CH');
		case 'gd':
			return import('date-fns/locale/gd');
		case 'gl':
			return import('date-fns/locale/gl');
		case 'gu':
			return import('date-fns/locale/gu');
		case 'he':
			return import('date-fns/locale/he');
		case 'hi':
			return import('date-fns/locale/hi');
		case 'hr':
			return import('date-fns/locale/hr');
		case 'ht':
			return import('date-fns/locale/ht');
		case 'hu':
			return import('date-fns/locale/hu');
		case 'hy':
			return import('date-fns/locale/hy');
		case 'id':
			return import('date-fns/locale/id');
		case 'is':
			return import('date-fns/locale/is');
		case 'it':
			return import('date-fns/locale/it');
		case 'ja':
			return import('date-fns/locale/ja');
		case 'ka':
			return import('date-fns/locale/ka');
		case 'kk':
			return import('date-fns/locale/kk');
		case 'kn':
			return import('date-fns/locale/kn');
		case 'ko':
			return import('date-fns/locale/ko');
		case 'lb':
			return import('date-fns/locale/lb');
		case 'lt':
			return import('date-fns/locale/lt');
		case 'lv':
			return import('date-fns/locale/lv');
		case 'mk':
			return import('date-fns/locale/mk');
		case 'mn':
			return import('date-fns/locale/mn');
		case 'ms':
			return import('date-fns/locale/ms');
		case 'mt':
			return import('date-fns/locale/mt');
		case 'nb':
			return import('date-fns/locale/nb');
		case 'nl':
			return import('date-fns/locale/nl');
		case 'nl-BE':
			return import('date-fns/locale/nl-BE');
		case 'nn':
			return import('date-fns/locale/nn');
		case 'pl':
			return import('date-fns/locale/pl');
		case 'pt':
			return import('date-fns/locale/pt');
		case 'pt-BR':
			return import('date-fns/locale/pt-BR');
		case 'ro':
			return import('date-fns/locale/ro');
		case 'ru':
			return import('date-fns/locale/ru');
		case 'sk':
			return import('date-fns/locale/sk');
		case 'sl':
			return import('date-fns/locale/sl');
		case 'sq':
			return import('date-fns/locale/sq');
		case 'sr':
			return import('date-fns/locale/sr');
		case 'sr-Latn':
			return import('date-fns/locale/sr-Latn');
		case 'sv':
			return import('date-fns/locale/sv');
		case 'ta':
			return import('date-fns/locale/ta');
		case 'te':
			return import('date-fns/locale/te');
		case 'th':
			return import('date-fns/locale/th');
		case 'tr':
			return import('date-fns/locale/tr');
		case 'ug':
			return import('date-fns/locale/ug');
		case 'uk':
			return import('date-fns/locale/uk');
		case 'uz':
			return import('date-fns/locale/uz');
		case 'vi':
			return import('date-fns/locale/vi');
		case 'zh-CN':
			return import('date-fns/locale/zh-CN');
		case 'zh-TW':
			return import('date-fns/locale/zh-TW');
		default:
			return Promise.resolve();
	}
}
