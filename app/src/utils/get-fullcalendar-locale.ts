import { LocaleInput } from '@fullcalendar/core';

export async function getFullcalendarLocale(lang: string): Promise<LocaleInput | undefined> {
	lang = lang.toLowerCase();

	const localesToTry = [lang, lang.split('-')[0]];

	let localeMod;

	for (const locale of localesToTry) {
		if (!locale) continue;

		try {
			const mod = await importCalendarLocale(locale);

			// There's a problem in how @fullcalendar/core exports the language to "fake" ESM
			localeMod = mod.default.default || mod.default;
			break;
		} catch {
			continue;
		}
	}

	return localeMod;
}

export function importCalendarLocale(locale: string): Promise<any> {
	switch (locale) {
		case 'af':
			return import('@fullcalendar/core/locales/af');
		case 'ar-dz':
			return import('@fullcalendar/core/locales/ar-dz');
		case 'ar-kw':
			return import('@fullcalendar/core/locales/ar-kw');
		case 'ar-ly':
			return import('@fullcalendar/core/locales/ar-ly');
		case 'ar-ma':
			return import('@fullcalendar/core/locales/ar-ma');
		case 'ar-sa':
			return import('@fullcalendar/core/locales/ar-sa');
		case 'ar-tn':
			return import('@fullcalendar/core/locales/ar-tn');
		case 'ar':
			return import('@fullcalendar/core/locales/ar');
		case 'az':
			return import('@fullcalendar/core/locales/az');
		case 'bg':
			return import('@fullcalendar/core/locales/bg');
		case 'bn':
			return import('@fullcalendar/core/locales/bn');
		case 'bs':
			return import('@fullcalendar/core/locales/bs');
		case 'ca':
			return import('@fullcalendar/core/locales/ca');
		case 'cs':
			return import('@fullcalendar/core/locales/cs');
		case 'cy':
			return import('@fullcalendar/core/locales/cy');
		case 'da':
			return import('@fullcalendar/core/locales/da');
		case 'de-at':
			return import('@fullcalendar/core/locales/de-at');
		case 'de':
			return import('@fullcalendar/core/locales/de');
		case 'el':
			return import('@fullcalendar/core/locales/el');
		case 'en-au':
			return import('@fullcalendar/core/locales/en-au');
		case 'en-gb':
			return import('@fullcalendar/core/locales/en-gb');
		case 'en-nz':
			return import('@fullcalendar/core/locales/en-nz');
		case 'eo':
			return import('@fullcalendar/core/locales/eo');
		case 'es-us':
			return import('@fullcalendar/core/locales/es-us');
		case 'es':
			return import('@fullcalendar/core/locales/es');
		case 'et':
			return import('@fullcalendar/core/locales/et');
		case 'eu':
			return import('@fullcalendar/core/locales/eu');
		case 'fa':
			return import('@fullcalendar/core/locales/fa');
		case 'fi':
			return import('@fullcalendar/core/locales/fi');
		case 'fr-ca':
			return import('@fullcalendar/core/locales/fr-ca');
		case 'fr-ch':
			return import('@fullcalendar/core/locales/fr-ch');
		case 'fr':
			return import('@fullcalendar/core/locales/fr');
		case 'gl':
			return import('@fullcalendar/core/locales/gl');
		case 'he':
			return import('@fullcalendar/core/locales/he');
		case 'hi':
			return import('@fullcalendar/core/locales/hi');
		case 'hr':
			return import('@fullcalendar/core/locales/hr');
		case 'hu':
			return import('@fullcalendar/core/locales/hu');
		case 'hy-am':
			return import('@fullcalendar/core/locales/hy-am');
		case 'id':
			return import('@fullcalendar/core/locales/id');
		case 'is':
			return import('@fullcalendar/core/locales/is');
		case 'it':
			return import('@fullcalendar/core/locales/it');
		case 'ja':
			return import('@fullcalendar/core/locales/ja');
		case 'ka':
			return import('@fullcalendar/core/locales/ka');
		case 'kk':
			return import('@fullcalendar/core/locales/kk');
		case 'ko':
			return import('@fullcalendar/core/locales/ko');
		case 'lb':
			return import('@fullcalendar/core/locales/lb');
		case 'lt':
			return import('@fullcalendar/core/locales/lt');
		case 'lv':
			return import('@fullcalendar/core/locales/lv');
		case 'mk':
			return import('@fullcalendar/core/locales/mk');
		case 'ms':
			return import('@fullcalendar/core/locales/ms');
		case 'nb':
			return import('@fullcalendar/core/locales/nb');
		case 'ne':
			return import('@fullcalendar/core/locales/ne');
		case 'nl':
			return import('@fullcalendar/core/locales/nl');
		case 'nn':
			return import('@fullcalendar/core/locales/nn');
		case 'pl':
			return import('@fullcalendar/core/locales/pl');
		case 'pt-br':
			return import('@fullcalendar/core/locales/pt-br');
		case 'pt':
			return import('@fullcalendar/core/locales/pt');
		case 'ro':
			return import('@fullcalendar/core/locales/ro');
		case 'ru':
			return import('@fullcalendar/core/locales/ru');
		case 'sk':
			return import('@fullcalendar/core/locales/sk');
		case 'sl':
			return import('@fullcalendar/core/locales/sl');
		case 'sq':
			return import('@fullcalendar/core/locales/sq');
		case 'sr-cyrl':
			return import('@fullcalendar/core/locales/sr-cyrl');
		case 'sr':
			return import('@fullcalendar/core/locales/sr');
		case 'sv':
			return import('@fullcalendar/core/locales/sv');
		case 'ta-in':
			return import('@fullcalendar/core/locales/ta-in');
		case 'th':
			return import('@fullcalendar/core/locales/th');
		case 'tr':
			return import('@fullcalendar/core/locales/tr');
		case 'ug':
			return import('@fullcalendar/core/locales/ug');
		case 'uk':
			return import('@fullcalendar/core/locales/uk');
		case 'uz':
			return import('@fullcalendar/core/locales/uz');
		case 'vi':
			return import('@fullcalendar/core/locales/vi');
		case 'zh-cn':
			return import('@fullcalendar/core/locales/zh-cn');
		case 'zh-tw':
			return import('@fullcalendar/core/locales/zh-tw');
		default:
			return Promise.resolve();
	}
}
