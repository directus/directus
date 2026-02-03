import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, Mock, test, vi } from 'vitest';
import { cryptoStub } from '@/__utils__/crypto';
import { useFieldsStore } from '@/stores/fields';
import { formatFieldFunction } from '@/utils/format-field-function';

vi.stubGlobal('crypto', cryptoStub);

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
