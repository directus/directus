import { LocaleInput } from '@fullcalendar/core';

export async function getFullcalendarLocale(lang: string): Promise<LocaleInput> {
	const localesToTry = [lang, lang.split('-')[0], 'en-US'];

	let locale;

	for (const l of localesToTry) {
		try {
			const mod = await importCalendarLocale(l);

			// There's a problem in how @fullcalendar/core exports the language to "fake" ESM
			locale = mod.default.default || mod.default;
			break;
		} catch {
			continue;
		}
	}

	return locale;
}

export function importCalendarLocale(locale: string): Promise<any> {
	switch (locale) {
		case 'af':
			return import('@fullcalendar/core/locales/af.js');
		case 'ar-dz':
			return import('@fullcalendar/core/locales/ar-dz.js');
		case 'ar-kw':
			return import('@fullcalendar/core/locales/ar-kw.js');
		case 'ar-ly':
			return import('@fullcalendar/core/locales/ar-ly.js');
		case 'ar-ma':
			return import('@fullcalendar/core/locales/ar-ma.js');
		case 'ar-sa':
			return import('@fullcalendar/core/locales/ar-sa.js');
		case 'ar-tn':
			return import('@fullcalendar/core/locales/ar-tn.js');
		case 'ar':
			return import('@fullcalendar/core/locales/ar.js');
		case 'az':
			return import('@fullcalendar/core/locales/az.js');
		case 'bg':
			return import('@fullcalendar/core/locales/bg.js');
		case 'bn':
			return import('@fullcalendar/core/locales/bn.js');
		case 'bs':
			return import('@fullcalendar/core/locales/bs.js');
		case 'ca':
			return import('@fullcalendar/core/locales/ca.js');
		case 'cs':
			return import('@fullcalendar/core/locales/cs.js');
		case 'cy':
			return import('@fullcalendar/core/locales/cy.js');
		case 'da':
			return import('@fullcalendar/core/locales/da.js');
		case 'de-at':
			return import('@fullcalendar/core/locales/de-at.js');
		case 'de':
			return import('@fullcalendar/core/locales/de.js');
		case 'el':
			return import('@fullcalendar/core/locales/el.js');
		case 'en-au':
			return import('@fullcalendar/core/locales/en-au.js');
		case 'en-gb':
			return import('@fullcalendar/core/locales/en-gb.js');
		case 'en-nz':
			return import('@fullcalendar/core/locales/en-nz.js');
		case 'eo':
			return import('@fullcalendar/core/locales/eo.js');
		case 'es-us':
			return import('@fullcalendar/core/locales/es-us.js');
		case 'es':
			return import('@fullcalendar/core/locales/es.js');
		case 'et':
			return import('@fullcalendar/core/locales/et.js');
		case 'eu':
			return import('@fullcalendar/core/locales/eu.js');
		case 'fa':
			return import('@fullcalendar/core/locales/fa.js');
		case 'fi':
			return import('@fullcalendar/core/locales/fi.js');
		case 'fr-ca':
			return import('@fullcalendar/core/locales/fr-ca.js');
		case 'fr-ch':
			return import('@fullcalendar/core/locales/fr-ch.js');
		case 'fr':
			return import('@fullcalendar/core/locales/fr.js');
		case 'gl':
			return import('@fullcalendar/core/locales/gl.js');
		case 'he':
			return import('@fullcalendar/core/locales/he.js');
		case 'hi':
			return import('@fullcalendar/core/locales/hi.js');
		case 'hr':
			return import('@fullcalendar/core/locales/hr.js');
		case 'hu':
			return import('@fullcalendar/core/locales/hu.js');
		case 'hy-am':
			return import('@fullcalendar/core/locales/hy-am.js');
		case 'id':
			return import('@fullcalendar/core/locales/id.js');
		case 'is':
			return import('@fullcalendar/core/locales/is.js');
		case 'it':
			return import('@fullcalendar/core/locales/it.js');
		case 'ja':
			return import('@fullcalendar/core/locales/ja.js');
		case 'ka':
			return import('@fullcalendar/core/locales/ka.js');
		case 'kk':
			return import('@fullcalendar/core/locales/kk.js');
		case 'ko':
			return import('@fullcalendar/core/locales/ko.js');
		case 'lb':
			return import('@fullcalendar/core/locales/lb.js');
		case 'lt':
			return import('@fullcalendar/core/locales/lt.js');
		case 'lv':
			return import('@fullcalendar/core/locales/lv.js');
		case 'mk':
			return import('@fullcalendar/core/locales/mk.js');
		case 'ms':
			return import('@fullcalendar/core/locales/ms.js');
		case 'nb':
			return import('@fullcalendar/core/locales/nb.js');
		case 'ne':
			return import('@fullcalendar/core/locales/ne.js');
		case 'nl':
			return import('@fullcalendar/core/locales/nl.js');
		case 'nn':
			return import('@fullcalendar/core/locales/nn.js');
		case 'pl':
			return import('@fullcalendar/core/locales/pl.js');
		case 'pt-br':
			return import('@fullcalendar/core/locales/pt-br.js');
		case 'pt':
			return import('@fullcalendar/core/locales/pt.js');
		case 'ro':
			return import('@fullcalendar/core/locales/ro.js');
		case 'ru':
			return import('@fullcalendar/core/locales/ru.js');
		case 'sk':
			return import('@fullcalendar/core/locales/sk.js');
		case 'sl':
			return import('@fullcalendar/core/locales/sl.js');
		case 'sq':
			return import('@fullcalendar/core/locales/sq.js');
		case 'sr-cyrl':
			return import('@fullcalendar/core/locales/sr-cyrl.js');
		case 'sr':
			return import('@fullcalendar/core/locales/sr.js');
		case 'sv':
			return import('@fullcalendar/core/locales/sv.js');
		case 'ta-in':
			return import('@fullcalendar/core/locales/ta-in.js');
		case 'th':
			return import('@fullcalendar/core/locales/th.js');
		case 'tr':
			return import('@fullcalendar/core/locales/tr.js');
		case 'ug':
			return import('@fullcalendar/core/locales/ug.js');
		case 'uk':
			return import('@fullcalendar/core/locales/uk.js');
		case 'uz':
			return import('@fullcalendar/core/locales/uz.js');
		case 'vi':
			return import('@fullcalendar/core/locales/vi.js');
		case 'zh-cn':
			return import('@fullcalendar/core/locales/zh-cn.js');
		case 'zh-tw':
			return import('@fullcalendar/core/locales/zh-tw.js');
		default:
			return Promise.resolve();
	}
}
