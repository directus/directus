import { expect, test } from 'vitest';
import { isCssVar } from '@/utils/is-css-var.js';

test('Returns true for valid var() with custom property', () => {
	expect(isCssVar('var(--primary-color)')).toBe(true);
});

test('Returns true for var() with fallback value', () => {
	expect(isCssVar('var(--color, blue)')).toBe(true);
	expect(isCssVar('var(--spacing, 20px)')).toBe(true);
	expect(isCssVar('var(--image, url("default.png"))')).toBe(true);
});

test('Returns true for nested var() functions', () => {
	expect(isCssVar('var(--main-color, var(--secondary-color))')).toBe(true);
	expect(isCssVar('var(--a, var(--b, var(--c, black)))')).toBe(true);
});

test('Returns true for var() with spaces and tabs', () => {
	expect(isCssVar('var(  --primary-color  )')).toBe(true);
	expect(isCssVar('var(--color , blue )')).toBe(true);
	expect(isCssVar('var(  --a ,  var(  --b )  )')).toBe(true);
});

test('Returns false for unbalanced parentheses', () => {
	expect(isCssVar('var(--primary-color')).toBe(false);
	expect(isCssVar('var(--primary-color))')).toBe(false);
	expect(isCssVar('var(--primary-color)(')).toBe(false);
});

test('Returns false for inputs not starting with var(', () => {
	expect(isCssVar('--primary-color)')).toBe(false);
	expect(isCssVar('some text var(--primary-color)')).toBe(false);
});

test('Returns false for inputs not ending with )', () => {
	expect(isCssVar('var(--primary-color')).toBe(false);
	expect(isCssVar('var(--primary-color) extra')).toBe(false);
});

test('Returns false for inputs with leading or trailing spaces', () => {
	expect(isCssVar(' var(--primary-color)')).toBe(false);
	expect(isCssVar('var(--primary-color) ')).toBe(false);
});
