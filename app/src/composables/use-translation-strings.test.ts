import api from '@/api';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useTranslationStrings } from './use-translation-strings';

vi.mock('@/api', () => {
	return {
		default: {
			get: vi.fn(),
			post: vi.fn(),
		},
	};
});

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

describe('Use Translation Strings', () => {
	test('Display translation strings', async () => {
		const { translationKeys, translationStrings, displayTranslationStrings } = useTranslationStrings();
		translationStrings.value = [{ key: 'test', value: 'test', lang: 'nl-NL' }];
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
	test('translation keys are sorted', async () => {
		const { translationKeys, translationStrings } = useTranslationStrings();
		translationStrings.value = [
			{ key: 'abc', value: 'test', lang: 'nl-NL' },
			{ key: 'zyx', value: 'test2', lang: 'nl-NL' },
		];

		expect(translationKeys.value).toStrictEqual(['abc', 'zyx']);
	});
});
