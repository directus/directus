import { afterEach, describe, expect, test, vi } from 'vitest';

import { merge } from 'lodash';
import { createI18n } from 'vue-i18n';
import availableLanguages from './available-languages.yaml';

const consoleErrorSpy = vi.spyOn(console, 'error');

afterEach(() => {
	vi.clearAllMocks();
});

/**
 * Flatten nested objects to dot notations
 * Example input: { a: { b: 'b', c: 'c' }, d: 'd' }
 * Example output: { 'a.b': 'b', 'a.c': 'c', d: 'd' }
 */
function flatten(item: Record<string, any> | string, path: string[] = []): any {
	if (typeof item === 'string') return { [path.join('.')]: item };
	return Object.entries(item).reduce((acc, [key, value]) => merge(acc, flatten(value, [...path, key])), {});
}

describe.each(Object.keys(availableLanguages).sort())('Locale %s', async (lang) => {
	const i18n = createI18n({ locale: lang, warnHtmlMessage: false });

	const { default: translations } = await import(`./translations/${lang}.yaml`);
	i18n.global.mergeLocaleMessage(lang, translations);

	const messages = flatten((i18n.global.messages as Record<string, any>)[lang]);
	const translationKeys = Object.keys(messages);

	test.skipIf(translationKeys.length === 0).each(translationKeys)('%s', (key) => {
		i18n.global.t(key);
		expect(consoleErrorSpy).not.toBeCalled();
	});
});
