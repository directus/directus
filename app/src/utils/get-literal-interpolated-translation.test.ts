import { expect, test } from 'vitest';
import { getLiteralInterpolatedTranslation } from '@/utils/get-literal-interpolated-translation';

test('No special characters', () => {
	expect(getLiteralInterpolatedTranslation('folding at home')).toBe('folding at home');
});

test('With special characters', () => {
	expect(getLiteralInterpolatedTranslation('folding@home')).toBe(`folding{'@'}home`);
});

test('Should not keep curly brackets', () => {
	expect(getLiteralInterpolatedTranslation('my {custom} string')).toBe(`my {'{'}custom{'}'} string`);
});

test('Should keep curly brackets', () => {
	expect(getLiteralInterpolatedTranslation('my {custom} string', true)).toBe(`my {custom} string`);
});
