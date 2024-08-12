import { i18n } from '@/lang';
import { EditorOptions } from 'tinymce';

export function getTinymceLocale(): Pick<EditorOptions, 'language' | 'language_url'> {
	const currentLang = i18n.global.locale.value;
	const [lang, locale] = currentLang.split('-').map((l) => l.toLowerCase()) as [string, string];
	const locales = [currentLang, lang, locale];
	let language = '';
	let language_url = '';

	for (const l of locales) {
		language = getLanguage(l);
		if (!language) continue;
		language_url = getLanguageUrl(language);
		if (language_url) break;
	}

	return { language, language_url };
}

export function getLanguage(locale: string): string {
	switch (locale) {
		case 'ar-SA':
			return 'ar_SA';
		case 'ar':
			return 'ar';
		case 'az':
			return 'az';
		case 'be':
			return 'be';
		case 'bg':
			return 'bg_BG';
		case 'bn':
			return 'bn_BD';
		case 'ca':
			return 'ca';
		case 'cs':
			return 'cs';
		case 'cy':
			return 'cy';
		case 'da':
			return 'da';
		case 'de':
			return 'de';
		case 'el':
			return 'el';
		case 'eo':
			return 'eo';
		case 'es-MX':
			return 'es_MX';
		case 'es':
			return 'es';
		case 'et':
			return 'et';
		case 'eu':
			return 'eu';
		case 'fa':
			return 'fa';
		case 'fi':
			return 'fi';
		case 'fr':
			return 'fr_FR';
		case 'ga':
			return 'ga';
		case 'gl':
			return 'gl';
		case 'he':
			return 'he_IL';
		case 'hr':
			return 'hr';
		case 'hu':
			return 'hu_HU';
		case 'hy':
			return 'hy';
		case 'id':
			return 'id';
		case 'is':
			return 'is_IS';
		case 'it':
			return 'it';
		case 'ja':
			return 'ja';
		case 'ka':
			return 'ka_GE';
		case 'kab':
			return 'kab';
		case 'kk':
			return 'kk';
		case 'ko':
			return 'ko_KR';
		case 'ku':
			return 'ku';
		case 'ky':
			return 'ky';
		case 'lt':
			return 'lt';
		case 'lv':
			return 'lv';
		case 'nb':
			return 'nb_NO';
		case 'ne':
			return 'ne';
		case 'nl':
			return 'nl';
		case 'nl-BE':
			return 'nl_BE';
		case 'oc':
			return 'oc';
		case 'pl':
			return 'pl';
		case 'pt':
			return 'pt_PT';
		case 'pt-BR':
			return 'pt_BR';
		case 'ro':
			return 'ro';
		case 'ru':
			return 'ru';
		case 'sk':
			return 'sk';
		case 'sl':
			return 'sl_SI';
		case 'sq':
			return 'sq';
		case 'sr':
			return 'sr';
		case 'sv':
			return 'sv_SE';
		case 'ta':
			return 'ta';
		case 'tg':
			return 'tg';
		case 'th':
			return 'th_TH';
		case 'tr':
			return 'tr';
		case 'ug':
			return 'ug';
		case 'uk':
			return 'uk';
		case 'uz':
			return 'uz';
		case 'vi':
			return 'vi';
		case 'zh-CN':
			return 'zh_CN';
		case 'zh-HK':
			return 'zh_HK';
		case 'zh-MO':
			return 'zh_MO';
		case 'zh-SG':
			return 'zh_SG';
		case 'zh-TW':
			return 'zh_TW';
		default:
			'';
	}

	return '';
}

export function getLanguageUrl(locale: string): string {
	return new URL(`../lang/tinymce/${locale}.js`, import.meta.url).href;
}
