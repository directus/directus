import { afterEach, describe, expect, test, vi } from 'vitest';

import { merge } from 'lodash';
import { createI18n } from 'vue-i18n';
import availableLanguages from './available-languages.yaml';

const locales = Object.keys(availableLanguages).sort();
const consoleErrorSpy = vi.spyOn(console, 'error');

afterEach(() => {
	vi.clearAllMocks();
});

/**
 * Flatten nested objects to dot notations
 * Example input: { a: { b: 'b', c: 'c' }, d: 'd' }
 * Example output: { 'a.b': 'b', 'a.c': 'c', d: 'd' }
 */
function flatten(item: Record<string, any> | string, path: string[] = []): Record<string, any> {
	if (typeof item === 'string') return { [path.join('.')]: item };
	return Object.entries(item).reduce((acc, [key, value]) => merge(acc, flatten(value, [...path, key])), {});
}

describe.each(locales)('Locale %s', async (locale) => {
	const i18n = createI18n({ locale: locale });

	const { default: translations } = await import(`./translations/${locale}.yaml`);
	i18n.global.mergeLocaleMessage(locale, translations);

	const messages = flatten((i18n.global.messages as Record<string, any>)[locale]);
	const translationKeys = Object.keys(messages);

	test.skipIf(translationKeys.length === 0).each(translationKeys)('%s', (key) => {
		i18n.global.t(key);
		expect(consoleErrorSpy).not.toBeCalled();
	});
});
