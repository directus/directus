import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useTranslationStrings } from './use-translation-strings';

vi.mock('@/api', () => {
	return {
		default: {
			get: vi.fn(),
			post: vi.fn(),
			patch: vi.fn(),
			delete: vi.fn(),
		},
	};
});

vi.mock('@/stores/settings', () => ({
	useSettingsStore: vi.fn(() => ({
		updateSettings: vi.fn(),
	})),
}));

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		})
	);
});

afterEach(() => {
	vi.clearAllMocks();
});

const TEST_TRANSLATIONS = [
	{ key: 'abc', value: 'test', language: 'nl-NL' },
	{ key: 'zyx', value: 'test2', language: 'nl-NL' },
];

describe('Use Translation Strings', () => {
	test('Display translation strings', async () => {
		const { translationKeys, translationStrings, displayTranslationStrings } = useTranslationStrings();
		translationStrings.value = [{ key: 'test', value: 'test', language: 'nl-NL' }];
		// check the formatted results
		expect(translationKeys.value).toStrictEqual(['test']);
		expect(displayTranslationStrings.value).toStrictEqual([
			{
				key: 'test',
				translations: [
					{
						language: 'nl-NL',
						translation: 'test',
					},
				],
			},
		]);
	});
	test('Same keys should get merged', async () => {
		const { translationStrings, displayTranslationStrings } = useTranslationStrings();
		translationStrings.value = [
			{ key: 'test', value: 'test', language: 'nl-NL' },
			{ key: 'test', value: 'test', language: 'en-GB' },
		];

		expect(displayTranslationStrings.value).toStrictEqual([
			{
				key: 'test',
				translations: [
					{
						language: 'nl-NL',
						translation: 'test',
					},
					{
						language: 'en-GB',
						translation: 'test',
					},
				],
			},
		]);
	});
	test('Translation keys should be sorted alphabetically', async () => {
		const { translationKeys, translationStrings } = useTranslationStrings();
		translationStrings.value = TEST_TRANSLATIONS;

		expect(translationKeys.value).toStrictEqual(['abc', 'zyx']);
	});
	test('Add a new translation to the list', async () => {
		const { translationKeys, translationStrings, upsertTranslation } = useTranslationStrings();
		translationStrings.value = [];
		await upsertTranslation({
			key: 'test',
			translations: [
				{
					language: 'nl-NL',
					translation: 'test',
				},
				{
					language: 'en-GB',
					translation: 'test',
				},
			],
		});
		expect(translationKeys.value).toStrictEqual(['test']);
		expect(translationStrings.value.length).toEqual(2);
		expect(translationStrings.value).toStrictEqual([
			{ key: 'test', language: 'nl-NL', value: 'test' },
			{ key: 'test', language: 'en-GB', value: 'test' },
		]);
	});
	test('Remove translation from the list', async () => {
		const { translationKeys, translationStrings, removeTranslation } = useTranslationStrings();
		translationStrings.value = TEST_TRANSLATIONS;
		await removeTranslation('zyx');
		expect(translationStrings.value.length).toBe(1);
		expect(translationKeys.value).toStrictEqual(['abc']);
		await removeTranslation('abc');
		expect(translationStrings.value.length).toBe(0);
	});
	test('Update a translation in the list', async () => {
		const { translationStrings, upsertTranslation } = useTranslationStrings();
		translationStrings.value = TEST_TRANSLATIONS;
		await upsertTranslation({
			key: 'zyx',
			translations: [
				{
					language: 'nl-NL',
					translation: 'test3',
				},
			],
		});
		expect(translationStrings.value.length).toBe(2);
		expect(translationStrings.value).toStrictEqual([
			{ key: 'abc', value: 'test', language: 'nl-NL' },
			{ key: 'zyx', value: 'test3', language: 'nl-NL' },
		]);
	});
	test('Rename the key of a translation in the list', async () => {
		const { translationKeys, translationStrings, upsertTranslation, removeTranslation } = useTranslationStrings();
		translationStrings.value = TEST_TRANSLATIONS;
		await removeTranslation('abc');
		await upsertTranslation({
			key: 'def',
			translations: [
				{
					language: 'nl-NL',
					translation: 'test4',
				},
			],
		});
		expect(translationKeys.value).toStrictEqual(['def', 'zyx']);
		expect(translationStrings.value.length).toBe(2);
		expect(translationStrings.value).toStrictEqual([
			{ key: 'zyx', value: 'test2', language: 'nl-NL' },
			{ key: 'def', value: 'test4', language: 'nl-NL' },
		]);
	});
});
