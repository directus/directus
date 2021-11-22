import { LocaleInput } from '@fullcalendar/core';

import importCalendarLocale from './import-calendar-locale';

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
