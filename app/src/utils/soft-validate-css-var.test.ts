import { test, expect } from 'vitest';

import { softValidateCssVar } from '@/utils/soft-validate-css-var';

test('Returns true for valid var() with custom property', () => {
	expect(softValidateCssVar('var(--primary-color)')).toBe(true);
});

test('Returns true for var() with fallback value', () => {
	expect(softValidateCssVar('var(--color, blue)')).toBe(true);
	expect(softValidateCssVar('var(--spacing, 20px)')).toBe(true);
	expect(softValidateCssVar('var(--image, url("default.png"))')).toBe(true);
});

test('Returns true for nested var() functions', () => {
	expect(softValidateCssVar('var(--main-color, var(--secondary-color))')).toBe(true);
	expect(softValidateCssVar('var(--a, var(--b, var(--c, black)))')).toBe(true);
});

test('Returns true for var() with spaces and tabs', () => {
	expect(softValidateCssVar('var(  --primary-color  )')).toBe(true);
	expect(softValidateCssVar('var(--color , blue )')).toBe(true);
	expect(softValidateCssVar('var(  --a ,  var(  --b )  )')).toBe(true);
});

test('Returns false for unbalanced parentheses', () => {
	expect(softValidateCssVar('var(--primary-color')).toBe(false);
	expect(softValidateCssVar('var(--primary-color))')).toBe(false);
	expect(softValidateCssVar('var(--primary-color)(')).toBe(false);
});

test('Returns false for inputs not starting with var(', () => {
	expect(softValidateCssVar('--primary-color)')).toBe(false);
	expect(softValidateCssVar('some text var(--primary-color)')).toBe(false);
});

test('Returns false for inputs not ending with )', () => {
	expect(softValidateCssVar('var(--primary-color')).toBe(false);
	expect(softValidateCssVar('var(--primary-color) extra')).toBe(false);
});

test('Returns false for inputs with leading or trailing spaces', () => {
	expect(softValidateCssVar(' var(--primary-color)')).toBe(false);
	expect(softValidateCssVar('var(--primary-color) ')).toBe(false);
});
