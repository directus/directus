import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OverlayManager } from './overlay-manager.ts';

const mockGetTheme = vi.fn().mockReturnValue(null);

vi.mock('./directus-frame.ts', () => ({
	DirectusFrame: vi.fn(function () {
		return {
			isAiEnabled: vi.fn().mockReturnValue(false),
			getTheme: mockGetTheme,
			getMessages: vi.fn().mockReturnValue(null),
		};
	}),
}));

describe('OverlayManager', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
		document.head.innerHTML = '';
		mockGetTheme.mockReturnValue(null);
	});

	afterEach(() => {
		document.getElementById('directus-visual-editing')?.remove();
		document.getElementById('directus-visual-editing-style')?.remove();
	});

	describe('getGlobalOverlay', () => {
		it('creates a div with the correct id when none exists', () => {
			const overlay = OverlayManager.getGlobalOverlay();

			expect(overlay.id).toBe('directus-visual-editing');
		});

		it('inserts the overlay immediately after body', () => {
			const overlay = OverlayManager.getGlobalOverlay();

			expect(document.body.nextElementSibling).toBe(overlay);
		});

		it('returns the same element on repeated calls', () => {
			const first = OverlayManager.getGlobalOverlay();
			const second = OverlayManager.getGlobalOverlay();

			expect(second).toBe(first);
			expect(document.querySelectorAll('#directus-visual-editing').length).toBe(1);
		});
	});

	it('appends a <style> element with the correct id to <head>', () => {
		OverlayManager.addStyles();

		const style = document.getElementById('directus-visual-editing-style');
		expect(style).toBeInstanceOf(HTMLStyleElement);
		expect(style?.parentElement).toBe(document.head);
	});
});

describe('addStyles theme injection', () => {
	beforeEach(() => {
		mockGetTheme.mockReturnValue(null);
	});

	afterEach(() => {
		document.getElementById('directus-visual-editing-style')?.remove();
	});

	it('uses theme.primaryColor as the rect border-color fallback', () => {
		mockGetTheme.mockReturnValue({
			primaryColor: '#aa00ff',
			primaryAccentColor: '#770099',
			borderRadius: '4px',
			buttonSize: '24px',
			focusRingWidth: '2px',
			focusRingOffset: '2px',
		});

		OverlayManager.addStyles();

		const css = document.getElementById('directus-visual-editing-style')?.textContent ?? '';
		expect(css).toContain('#aa00ff');
		expect(css).toContain('#770099');
		expect(css).toContain('4px');
	});

	it('falls back to compiled-in defaults when theme is null', () => {
		OverlayManager.addStyles();

		const css = document.getElementById('directus-visual-editing-style')?.textContent ?? '';
		expect(css).toContain('#6644ff');
		// new hover-bg-color var defaults to admin primary-accent formula; library default mirrors it
		expect(css).toContain('color-mix(in srgb, #6644ff, #2e3C43 25%)');
	});

	it('substitutes compiled-in defaults for empty-string fields', () => {
		mockGetTheme.mockReturnValue({
			primaryColor: '',
			primaryAccentColor: '',
			borderRadius: '',
			buttonSize: '',
			focusRingWidth: '',
			focusRingOffset: '',
		});

		OverlayManager.addStyles();

		const css = document.getElementById('directus-visual-editing-style')?.textContent ?? '';
		// no broken declarations like `var(name, )` or `background-color: ;`
		expect(css).not.toMatch(/,\s*\)/);
		expect(css).toContain('#6644ff');
	});

	it('positions the button cluster above the rect with a bridge pseudo-element', () => {
		OverlayManager.addStyles();

		const css = document.getElementById('directus-visual-editing-style')?.textContent ?? '';

		// New offset var must appear
		expect(css).toContain('--directus-visual-editing--actions--offset');
		// Bridge pseudo-element on the button must be present
		expect(css).toMatch(/\.directus-visual-editing-button::after\s*\{[^}]*content:\s*''/);
		// transform: translate is no longer used on rect-button
		expect(css).not.toMatch(/\.directus-visual-editing-button[^{]*\{[^}]*transform:\s*translate/);
	});

	it('emits a :focus-visible rule driven by theme.primaryColor and focus-ring tokens', () => {
		mockGetTheme.mockReturnValue({
			primaryColor: '#aa00ff',
			primaryAccentColor: '#770099',
			borderRadius: '4px',
			buttonSize: '24px',
			focusRingWidth: '3px',
			focusRingOffset: '5px',
		});

		OverlayManager.addStyles();

		const css = document.getElementById('directus-visual-editing-style')?.textContent ?? '';
		expect(css).toMatch(/:focus-visible\s*\{[^}]*outline[^}]*#aa00ff/);
		expect(css).toMatch(/outline:[^;]*3px[^;]*solid/);
		expect(css).toContain('outline-offset:');
	});
});
