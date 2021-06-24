import { LocaleInput } from '@fullcalendar/core';

import importCalendarLocale from './import-calendar-locale';

export async function getFullcalendarLocale(lang: string): Promise<LocaleInput> {
	const localesToTry = [lang, lang.split('-')[0], 'en-US'];

	let locale;

	for (const l of localesToTry) {
		try {
			const mod = await importCalendarLocale(l);

			locale = mod.default.default;
			break;
		} catch {
			continue;
		}
	}

	return locale;
}
