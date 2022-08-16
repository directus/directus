import { test, expect } from 'vitest';
import { cssVar } from './css-var';

test('extract var from element', () => {
	document.body.style.setProperty('--my-var', '100px');

	expect(cssVar('--my-var')).toBe('100px');
	expect(cssVar('--no-var')).toBe('');
});
