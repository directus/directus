export default function importFlatpickrLocale(locale: string): Promise<any> {
	// TODO: add the remaining locales
	switch (locale) {
		case 'ar-DZ':
			return import('flatpickr/dist/l10n/ar.js');
		case 'ar-MA':
			return import('flatpickr/dist/l10n/ar.js');
		case 'ar-SA':
			return import('flatpickr/dist/l10n/ar.js');
		case 'en':
			return import('flatpickr/dist/l10n/default.js');
		case 'zh-CN':
			return import('flatpickr/dist/l10n/zh.js');
		case 'zh-TW':
			return import('flatpickr/dist/l10n/zh-tw.js');
		default:
			return Promise.resolve();
	}
}
