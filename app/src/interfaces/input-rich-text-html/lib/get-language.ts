import { getCurrentLanguage } from '@/lang/get-current-language';

export async function getLanguage() {
	const locale = getCurrentLanguage();

	try {
		const name = await loadLanguage(locale);
		return name;
	} catch {
		// Ignore
	}

	return;
}

async function loadLanguage(locale: string) {
	switch (locale) {
		case 'ar-SA':
			await import('tinymce-i18n/langs6/ar_SA');
			return 'ar_SA';
		case 'bg-BG':
			await import('tinymce-i18n/langs6/bg_BG');
			return 'bg_BG';
		case 'ca-ES':
			await import('tinymce-i18n/langs6/ca');
			return 'ca';
		case 'cs-CZ':
			await import('tinymce-i18n/langs6/cs');
			return 'cs';
		case 'da-DK':
			await import('tinymce-i18n/langs6/da');
			return 'da';
		case 'de-DE':
			await import('tinymce-i18n/langs6/de');
			return 'de';
		case 'el-GR':
			await import('tinymce-i18n/langs6/el');
			return 'el';
		case 'eo-UY':
			await import('tinymce-i18n/langs6/eo');
			return 'eo';
		case 'es-ES':
			await import('tinymce-i18n/langs6/es');
			return 'es';
		case 'es-MX':
			await import('tinymce-i18n/langs6/es_MX');
			return 'es_MX';
		case 'et-EE':
			await import('tinymce-i18n/langs6/et');
			return 'et';
		case 'fa-IR':
			await import('tinymce-i18n/langs6/fa');
			return 'fa';
		case 'fi-FI':
			await import('tinymce-i18n/langs6/fi');
			return 'fi';
		case 'fr-FR':
			await import('tinymce-i18n/langs6/fr_FR');
			return 'fr_FR';
		case 'he-IL':
			await import('tinymce-i18n/langs6/he_IL');
			return 'he_IL';
		case 'hi-IN':
			await import('tinymce-i18n/langs6/hi');
			return 'hi';
		case 'hr-HR':
			await import('tinymce-i18n/langs6/hr');
			return 'hr';
		case 'hu-HU':
			await import('tinymce-i18n/langs6/hu_HU');
			return 'hu_HU';
		case 'id-ID':
			await import('tinymce-i18n/langs6/id');
			return 'id';
		case 'is-IS':
			await import('tinymce-i18n/langs6/is_IS');
			return 'is_IS';
		case 'it-IT':
			await import('tinymce-i18n/langs6/it');
			return 'it';
		case 'ja-JP':
			await import('tinymce-i18n/langs6/ja');
			return 'ja';
		case 'ka-GE':
			await import('tinymce-i18n/langs6/ka_GE');
			return 'ka_GE';
		case 'ko-KR':
			await import('tinymce-i18n/langs6/ko_KR');
			return 'ko_KR';
		case 'lt-LT':
			await import('tinymce-i18n/langs6/lt');
			return 'lt';
		case 'nl-NL':
			await import('tinymce-i18n/langs6/nl');
			return 'nl';
		case 'pl-PL':
			await import('tinymce-i18n/langs6/pl');
			return 'pl';
		case 'pt-BR':
			await import('tinymce-i18n/langs6/pt_BR');
			return 'pt_BR';
		case 'ro-RO':
			await import('tinymce-i18n/langs6/ro');
			return 'ro';
		case 'ru-RU':
			await import('tinymce-i18n/langs6/ru');
			return 'ru';
		case 'sk-SK':
			await import('tinymce-i18n/langs6/sk');
			return 'sk';
		case 'sl-SI':
			await import('tinymce-i18n/langs6/sl_SI');
			return 'sl_SI';
		case 'sq-AL':
			await import('tinymce-i18n/langs6/sq');
			return 'sq';
		case 'sr-SP':
			await import('tinymce-i18n/langs6/sr');
			return 'sr';
		case 'sv-SE':
			await import('tinymce-i18n/langs6/sv_SE');
			return 'sv_SE';
		case 'tg-TJ':
			await import('tinymce-i18n/langs6/tg');
			return 'tg';
		case 'th-TH':
			await import('tinymce-i18n/langs6/th_TH');
			return 'th_TH';
		case 'tr-TR':
			await import('tinymce-i18n/langs6/tr');
			return 'tr';
		case 'uk-UA':
			await import('tinymce-i18n/langs6/uk');
			return 'uk';
		case 'vi-VN':
			await import('tinymce-i18n/langs6/vi');
			return 'vi';
		case 'zh-CN':
			await import('tinymce-i18n/langs6/zh-Hans');
			return 'zh-Hans';
		case 'zh-TW':
			await import('tinymce-i18n/langs6/zh-Hant');
			return 'zh-Hant';
	}

	return;
}
