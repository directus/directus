import { test, expect } from 'vitest';

import { translateShortcut } from '@/utils/translate-shortcut';

test('Windows/Linux', () => {
	window.navigator.platform = 'test';
	expect(translateShortcut(['meta', 's'])).toBe('Ctrl+S');
	expect(translateShortcut(['option', 's'])).toBe('Option+S');
	expect(translateShortcut(['alt', 's'])).toBe('Alt+S');
	expect(translateShortcut(['shift', 's'])).toBe('Shift+S');
});

test('macOS/iOS', () => {
	window.navigator.platform = 'MacIntel';

	expect(translateShortcut(['meta', 's'])).toBe('⌘S');
	expect(translateShortcut(['option', 's'])).toBe('⌥S');
	expect(translateShortcut(['alt', 's'])).toBe('⌥S');
	expect(translateShortcut(['shift', 's'])).toBe('⇧S');

	window.navigator.platform = 'iPad';

	expect(translateShortcut(['meta', 's'])).toBe('⌘S');
	expect(translateShortcut(['option', 's'])).toBe('⌥S');
	expect(translateShortcut(['alt', 's'])).toBe('⌥S');
	expect(translateShortcut(['shift', 's'])).toBe('⇧S');
});
