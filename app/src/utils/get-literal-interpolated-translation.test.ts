import { test, expect } from 'vitest';
import { getLiteralInterpolatedTranslation } from '@/utils/get-literal-interpolated-translation';

test('No special characters', () => {
	expect(getLiteralInterpolatedTranslation('folding at home')).toBe('folding at home');
});

test('With special characters', () => {
	expect(getLiteralInterpolatedTranslation('folding@home')).toBe(`folding{'@'}home`);
});
