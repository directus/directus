import { beforeEach, expect, Mock, test, vi } from 'vitest';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { createI18n } from 'vue-i18n';

import { cryptoStub } from '@/__utils__/crypto';

vi.stubGlobal('crypto', cryptoStub);

import { useFieldsStore } from '@/stores/fields';
import { formatFieldFunction } from '@/utils/format-field-function';

vi.mock('@/lang', () => {
	return {
		i18n: createI18n({
			legacy: false,
			locale: 'en-US',
			messages: {
				'en-US': {
					functions: {
						year: 'Year',
					},
				},
			},
		}),
	};
});

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
		}),
	);
});

test('Returns original field key if no function is passed, and field cannot be found', () => {
	expect(formatFieldFunction('articles', 'date_created')).toBe('date_created');
});

test('Returns translated field key if no function is passed', () => {
	(useFieldsStore().getField as Mock).mockReturnValueOnce({ name: 'Date Created' });
	expect(formatFieldFunction('articles', 'date_created')).toBe('Date Created');
});

test('Returns translated function with field key if field cannot be found in store', () => {
	expect(formatFieldFunction('articles', 'year(date_created)')).toBe('Year (date_created)');
});

test('Returns translated field key and function', () => {
	(useFieldsStore().getField as Mock).mockReturnValueOnce({ name: 'Date Created' });
	expect(formatFieldFunction('articles', 'year(date_created)')).toBe('Year (Date Created)');
});
