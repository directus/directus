import { test, expect, describe } from 'vitest';
import { getMinimalGridClass } from '@/utils/get-minimal-grid-class';

describe('getMinimalGridClass', () => {
	test('Returns null when choices are undefined', () => {
		expect(getMinimalGridClass(undefined, 'full')).toBeNull();
	});

	test('Returns grid class when width starts with "half" and widestOptionLength <= 10', () => {
		const choices = [
			{ text: 'short', value: '1' },
			{ text: 'text', value: '2' },
		];

		expect(getMinimalGridClass(choices, 'half')).toBe('grid-2');
	});

	test('Returns grid class when width starts with "half" and widestOptionLength > 10', () => {
		const choices = [
			{ text: 'a very long text', value: '1' },
			{ text: 'another long text', value: '2' },
		];

		expect(getMinimalGridClass(choices, 'half')).toBe('grid-1');
	});

	test('Returns grid class when width is full and widestOptionLength <= 10', () => {
		const choices = [
			{ text: 'short', value: '1' },
			{ text: 'text', value: '2' },
			{ text: 'text', value: '3' },
			{ text: 'text', value: '4' },
			{ text: 'text', value: '5' },
		];

		expect(getMinimalGridClass(choices, 'full')).toBe('grid-4');
	});

	test('Returns grid class when width is full and 10 < widestOptionLength <= 15', () => {
		const choices = [
			{ text: 'medium text', value: '1' },
			{ text: 'another text', value: '2' },
			{ text: 'another text', value: '3' },
		];

		expect(getMinimalGridClass(choices, 'full')).toBe('grid-3');
	});

	test('Returns grid class when width is full and 15 < widestOptionLength <= 25', () => {
		const choices = [
			{ text: 'longer text than usual', value: '1' },
			{ text: 'quite long text', value: '2' },
			{ text: 'quite long text', value: '3' },
		];

		expect(getMinimalGridClass(choices, 'full')).toBe('grid-2');
	});

	test('Returns grid class when width is full and widestOptionLength > 25', () => {
		const choices = [
			{ text: 'a very very long text that exceeds 25 characters', value: '1' },
			{ text: 'another extremely long text', value: '2' },
		];

		expect(getMinimalGridClass(choices, 'full')).toBe('grid-1');
	});
});
