import { expect, test } from 'vitest';
import { validateText } from './validate-text.js';

test('Throws error if search string contains author qualifier', () => {
	expect(() => validateText('author:rijk')).toThrowErrorMatchingInlineSnapshot(
		`[TypeError: Search text cannot contain npm special search qualifiers]`,
	);

	expect(() => validateText('some other search author:rijk')).toThrowErrorMatchingInlineSnapshot(
		`[TypeError: Search text cannot contain npm special search qualifiers]`,
	);
});

test('Throws error if search string contains maintainer qualifier', () => {
	expect(() => validateText('maintainer:rijk')).toThrowErrorMatchingInlineSnapshot(
		`[TypeError: Search text cannot contain npm special search qualifiers]`,
	);

	expect(() => validateText('some other search maintainer:rijk')).toThrowErrorMatchingInlineSnapshot(
		`[TypeError: Search text cannot contain npm special search qualifiers]`,
	);
});

test('Throws error if search string contains keywords qualifier', () => {
	expect(() => validateText('keywords:test,foo+bar')).toThrowErrorMatchingInlineSnapshot(
		`[TypeError: Search text cannot contain npm special search qualifiers]`,
	);

	expect(() => validateText('some other search keywords:test,foo+bar')).toThrowErrorMatchingInlineSnapshot(
		`[TypeError: Search text cannot contain npm special search qualifiers]`,
	);
});

test('Throws error if search string contains not qualifier', () => {
	expect(() => validateText('not:insecure')).toThrowErrorMatchingInlineSnapshot(
		`[TypeError: Search text cannot contain npm special search qualifiers]`,
	);

	expect(() => validateText('some other search not:insecure')).toThrowErrorMatchingInlineSnapshot(
		`[TypeError: Search text cannot contain npm special search qualifiers]`,
	);
});

test('Throws error if search string contains is qualifier', () => {
	expect(() => validateText('is:insecure')).toThrowErrorMatchingInlineSnapshot(
		`[TypeError: Search text cannot contain npm special search qualifiers]`,
	);

	expect(() => validateText('some other search is:insecure')).toThrowErrorMatchingInlineSnapshot(
		`[TypeError: Search text cannot contain npm special search qualifiers]`,
	);
});

test('Throws error if search string contains boost-exact qualifier', () => {
	expect(() => validateText('boost-exact:true')).toThrowErrorMatchingInlineSnapshot(
		`[TypeError: Search text cannot contain npm special search qualifiers]`,
	);

	expect(() => validateText('some other search boost-exact:true')).toThrowErrorMatchingInlineSnapshot(
		`[TypeError: Search text cannot contain npm special search qualifiers]`,
	);
});

test('Does not throw error if search text does not contain qualifiers', () => {
	expect(() => validateText('some search query')).not.toThrow();
});
