import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OverlayElement } from './overlay-element.ts';
import { OverlayManager } from './overlay-manager.ts';
import { EditableStore } from './editable-store.ts';

const mockIsAiEnabled = vi.fn().mockReturnValue(false);

vi.mock('./directus-frame.ts', () => ({
	DirectusFrame: vi.fn(function () {
		return { isAiEnabled: mockIsAiEnabled };
	}),
}));

function getRect(): HTMLElement {
	return OverlayManager.getGlobalOverlay().querySelector(`.${OverlayManager.RECT_CLASS_NAME}`) as HTMLElement;
}

function getContainer(): HTMLElement {
	return OverlayManager.getGlobalOverlay().querySelector(`.${OverlayManager.CONTAINER_RECT_CLASS_NAME}`) as HTMLElement;
}

describe('OverlayElement', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
		document.head.innerHTML = '';
		mockIsAiEnabled.mockReturnValue(false);
		EditableStore.highlightOverlayElements = false;
	});

	afterEach(() => {
		document.getElementById('directus-visual-editing')?.remove();
		document.getElementById('directus-visual-editing-style')?.remove();
		vi.restoreAllMocks();
	});

	it('creates edit button as child of rect with correct classes', () => {
		const overlay = new OverlayElement();

		expect(overlay.editButton).toBeInstanceOf(HTMLButtonElement);
		expect(overlay.editButton.type).toBe('button');
		expect(overlay.editButton.classList.contains(OverlayManager.RECT_BUTTON_CLASS_NAME)).toBe(true);
		expect(overlay.editButton.classList.contains(OverlayManager.RECT_EDIT_BUTTON_CLASS_NAME)).toBe(true);
		expect(overlay.editButton.parentElement).toBe(getRect());
	});

	it('does not create AI button when AI is disabled', () => {
		const overlay = new OverlayElement();

		expect(overlay.aiButton).toBeNull();
	});

	it('creates AI button as child of rect with correct classes when AI is enabled', () => {
		mockIsAiEnabled.mockReturnValue(true);

		const overlay = new OverlayElement();

		expect(overlay.aiButton).toBeInstanceOf(HTMLButtonElement);
		expect(overlay.aiButton?.type).toBe('button');
		expect(overlay.aiButton?.classList.contains(OverlayManager.RECT_BUTTON_CLASS_NAME)).toBe(true);
		expect(overlay.aiButton?.classList.contains(OverlayManager.RECT_AI_BUTTON_CLASS_NAME)).toBe(true);
		expect(overlay.aiButton?.parentElement).toBe(getRect());
	});

	it('applies highlight class when highlightOverlayElements is true at construction time', () => {
		EditableStore.highlightOverlayElements = true;

		new OverlayElement();

		expect(getRect().classList.contains(OverlayManager.RECT_HIGHLIGHT_CLASS_NAME)).toBe(true);
	});

	describe('updateRect()', () => {
		it('sets width, height, and transform from DOMRect', () => {
			const overlay = new OverlayElement();

			overlay.updateRect({ width: 100, height: 50, left: 10, top: 20 } as DOMRect);

			const rect = getRect();
			expect(rect.style.width).toBe('100px');
			expect(rect.style.height).toBe('50px');
			expect(rect.style.transform).toBe('translate(10px,20px)');
		});

		it('hides overlay when either dimension is zero and shows it when both dimensions are non-zero', () => {
			const overlay = new OverlayElement();

			overlay.updateRect({ width: 0, height: 50, left: 0, top: 0 } as DOMRect);
			expect(getRect().style.display).toBe('none');

			overlay.updateRect({ width: 100, height: 0, left: 0, top: 0 } as DOMRect);
			expect(getRect().style.display).toBe('none');

			overlay.updateRect({ width: 100, height: 50, left: 0, top: 0 } as DOMRect);
			expect(getRect().style.display).toBe('');
		});
	});

	it('sets display to none when disable() is called and restores it when enable() is called', () => {
		const overlay = new OverlayElement();

		overlay.disable();
		expect(getRect().style.display).toBe('none');

		overlay.enable();
		expect(getRect().style.display).toBe('');
	});

	it('removes overlay container from DOM when remove() is called', () => {
		const overlay = new OverlayElement();
		const globalOverlay = OverlayManager.getGlobalOverlay();

		expect(globalOverlay.children.length).toBe(1);

		overlay.remove();
		expect(globalOverlay.children.length).toBe(0);
	});

	describe('setCustomClass()', () => {
		it('adds valid class to container', () => {
			const overlay = new OverlayElement();

			overlay.setCustomClass('my-custom-class');
			expect(getContainer().classList.contains('my-custom-class')).toBe(true);
		});

		it('rejects invalid class names', () => {
			const overlay = new OverlayElement();
			const before = getContainer().classList.length;

			overlay.setCustomClass('123-invalid');
			overlay.setCustomClass('has invalid class name');
			overlay.setCustomClass(undefined);
			expect(getContainer().classList.length).toBe(before);
		});
	});

	it('toggles hover class when toggleHover() is called', () => {
		const overlay = new OverlayElement();

		overlay.toggleHover(true);
		expect(getRect().classList.contains(OverlayManager.RECT_HOVER_CLASS_NAME)).toBe(true);

		overlay.toggleHover(false);
		expect(getRect().classList.contains(OverlayManager.RECT_HOVER_CLASS_NAME)).toBe(false);
	});

	it('toggles parent hover class when toggleParentHover() is called', () => {
		const overlay = new OverlayElement();

		overlay.toggleParentHover(true);
		expect(getRect().classList.contains(OverlayManager.RECT_PARENT_HOVER_CLASS_NAME)).toBe(true);

		overlay.toggleParentHover(false);
		expect(getRect().classList.contains(OverlayManager.RECT_PARENT_HOVER_CLASS_NAME)).toBe(false);
	});

	it('toggles highlight class when toggleHighlight() is called', () => {
		const overlay = new OverlayElement();

		overlay.toggleHighlight(true);
		expect(getRect().classList.contains(OverlayManager.RECT_HIGHLIGHT_CLASS_NAME)).toBe(true);

		overlay.toggleHighlight(false);
		expect(getRect().classList.contains(OverlayManager.RECT_HIGHLIGHT_CLASS_NAME)).toBe(false);
	});

	it('toggles highlight active class when toggleHighlightActive() is called', () => {
		const overlay = new OverlayElement();

		overlay.toggleHighlightActive(true);
		expect(getRect().classList.contains(OverlayManager.RECT_HIGHLIGHT_ACTIVE_CLASS_NAME)).toBe(true);

		overlay.toggleHighlightActive(false);
		expect(getRect().classList.contains(OverlayManager.RECT_HIGHLIGHT_ACTIVE_CLASS_NAME)).toBe(false);
	});
});
