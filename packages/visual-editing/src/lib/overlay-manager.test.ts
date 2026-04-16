import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OverlayManager } from './overlay-manager.ts';

describe('OverlayManager', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
		document.head.innerHTML = '';
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
