import * as lang from './index';

describe('i18n / setLanguage', () => {
	it('Returns false if invalid language is passed', async () => {
		// @ts-ignore
		const result = await lang.setLanguage('abc');
		expect(result).toBe(false);
	});

	it('Returns true if given language is current language', async () => {
		const result = await lang.setLanguage('en-US');
		expect(result).toBe(true);
	});

	it('Returns true on a successful import', async () => {
		const result = await lang.setLanguage('nl-NL');
		// TODO I would like to figure out how to mock the dynamic import in here, so we can
		// test if it's actually fetching the correct files in the import
		expect(result).toBe(true);
		expect(lang.i18n.locale).toBe('nl-NL');
	});

	it('Immediately sets language if locale is already loaded', async () => {
		lang.loadedLanguages.push('de-DE');
		const result = await lang.setLanguage('de-DE');
		expect(result).toBe(true);
		expect(lang.i18n.locale).toBe('de-DE');
	});

	afterAll(() => {
		jest.restoreAllMocks();
	});
});
