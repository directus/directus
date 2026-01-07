
import { format } from 'date-fns';
import { merge } from 'lodash';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import availableLanguages from './available-languages.yaml';
import { importDateLocale } from '@/utils/get-date-fns-locale';

const locales = Object.keys(availableLanguages).sort();
const consoleErrorSpy = vi.spyOn(console, 'error');

afterEach(() => {
	vi.clearAllMocks();
});

describe.each(locales)('Locale %s', async (locale) => {
	const i18n = createI18n({ legacy: false, locale: locale });
	const datefnsLocale = (await importDateLocale(locale))?.default;

	const { isImported, translations } = await importLanguageFile(locale);
	i18n.global.mergeLocaleMessage(locale, translations);
	const messages = flatten((i18n.global.messages.value as Record<string, any>)[locale]);
	const translationSet = Object.entries(messages);

	test(`import ${locale} language file successfully`, () => {
		expect(isImported).toBe(true);
	});

	test.each(translationSet)('%s', (key, value) => {
		expect(value).toBeDefined();

		const translation = i18n.global.t(key);
		expect(consoleErrorSpy).not.toBeCalled();

		if (key.startsWith('date-fns_')) {
			const date = new Date();
			expect(() => format(date, translation, datefnsLocale ? { locale: datefnsLocale } : {})).not.toThrow();
		}
	});
});

async function importLanguageFile(locale: string): Promise<{ isImported: boolean; translations: Record<string, any> }> {
	try {
		const { default: translations } = await import(`./translations/${locale}.yaml`);
		return { isImported: true, translations };
	} catch {
		return { isImported: false, translations: {} };
	}
}

/**
 * Flatten nested objects to dot notations
 * Example input: { a: { b: 'b', c: 'c' }, d: 'd' }
 * Example output: { 'a.b': 'b', 'a.c': 'c', d: 'd' }
 */
function flatten(item: Record<string, any> | string | null, path: string[] = []): Record<string, any> {
	if (!item) return { [path.join('.')]: undefined };

	if (typeof item === 'string') return { [path.join('.')]: item };
	return Object.entries(item).reduce((acc, [key, value]) => merge(acc, flatten(value, [...path, key])), {});
}
