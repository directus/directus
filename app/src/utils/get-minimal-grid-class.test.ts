import { describe, expect, test } from 'vitest';
import { getMinimalGridClass } from '@/utils/get-minimal-grid-class';

describe('getMinimalGridClass', () => {
	test('Returns null when choices are undefined', () => {
		expect(getMinimalGridClass(undefined)).toBeNull();
	});

	test('Returns null when choices are empty', () => {
		expect(getMinimalGridClass([])).toBeNull();
	});

	describe('Minimum is based on amount of options', () => {
		test(`Returns "grid-1" if there's only one short option`, () => {
			const choices = [{ text: 'short' }];

			expect(getMinimalGridClass(choices)).toBe('grid-1');
		});

		test('Returns up to "grid-4" if there are multiple short options', () => {
			const choices = [{ text: 'short' }, { text: 'short' }, { text: 'short' }, { text: 'short' }, { text: 'short' }];

			expect(getMinimalGridClass(choices)).toBe('grid-4');
		});
	});

	test('Returns "grid-2" when interface width starts with "half" and widest option is <= 10', () => {
		const choices = [{ text: 'short' }, { text: 'short' }];

		expect(getMinimalGridClass(choices, 'half')).toBe('grid-2');
	});

	test('Returns "grid-1" when interface width starts with "half" and widest option is > 10', () => {
		const choices = [{ text: 'short' }, { text: 'a longer text' }];

		expect(getMinimalGridClass(choices, 'half')).toBe('grid-1');
	});

	test('Returns "grid-4" when interface width is full and widest option is <= 10', () => {
		const choices = [{ text: 'short' }, { text: 'short' }, { text: 'short' }, { text: 'short' }];

		expect(getMinimalGridClass(choices, 'full')).toBe('grid-4');
	});

	test('Returns "grid-3" when interface width is full and widest option is > 10 and <= 15', () => {
		const choices = [{ text: 'short' }, { text: 'short' }, { text: 'a longer text' }];

		expect(getMinimalGridClass(choices, 'full')).toBe('grid-3');
	});

	test('Returns "grid-2" when interface width is full and widest option is > 15 and <= 25', () => {
		const choices = [{ text: 'short' }, { text: 'quite long text' }];

		expect(getMinimalGridClass(choices, 'full')).toBe('grid-2');
	});

	test('Returns "grid-1" when interface width is full and widest option is > 25', () => {
		const choices = [{ text: 'short' }, { text: 'a very very long text that exceeds 25 characters' }];

		expect(getMinimalGridClass(choices, 'full')).toBe('grid-1');
	});
});
