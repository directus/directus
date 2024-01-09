import { parseJSON } from '@directus/utils';
import { afterEach, expect, test, vi } from 'vitest';
import { tryJson } from './try-json.js';

vi.mock('@directus/utils');

afterEach(() => {
	vi.clearAllMocks();
});

test('Returns parsed value', () => {
	const value = 123;
	vi.mocked(parseJSON).mockReturnValue(value);

	expect(tryJson('123')).toBe(value);
	expect(parseJSON).toHaveBeenCalledWith('123');
});

test('Returns original value if parseJSON errors', () => {
	const value = 123;

	vi.mocked(parseJSON).mockImplementation(() => {
		throw new Error('Nah');
	});

	expect(tryJson(value)).toBe(value);
});
