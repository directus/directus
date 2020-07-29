import translateShortcut from './translate-shortcut';

describe('Utils / Translate Shortcut', () => {
	it('Shows capitalized + separated on Windows', () => {
		Object.defineProperty(window.navigator, 'platform', { value: 'Win32', writable: true });

		expect(translateShortcut(['meta', 'shift', 's'])).toBe('Ctrl+Shift+S');
	});

	it('Shows Mac keys on Mac', () => {
		Object.defineProperty(window.navigator, 'platform', { value: 'Mac-Intel', writable: true });

		expect(translateShortcut(['meta', 'shift', 's'])).toBe('⌘⇧S');
	});
});
