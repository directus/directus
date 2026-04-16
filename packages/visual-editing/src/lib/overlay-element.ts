import { EditableStore } from './editable-store.ts';
import { OverlayManager } from './overlay-manager.ts';
import { DirectusFrame } from './directus-frame.ts';

export class OverlayElement {
	private hasNoDimensions: boolean = false;
	private element: HTMLElement;
	private container: HTMLElement;

	readonly editButton: HTMLButtonElement;
	readonly aiButton: HTMLButtonElement | null;

	constructor() {
		this.container = this.createContainer();
		this.element = this.createElement();
		this.editButton = this.createEditButton();
		this.aiButton = new DirectusFrame().isAiEnabled() ? this.createAiButton() : null;
		this.createRectElement();

		OverlayManager.getGlobalOverlay().appendChild(this.container);

		if (EditableStore.highlightOverlayElements) this.toggleHighlight(true);

		this.element.addEventListener('click', () => this.editButton.click());
	}

	private createContainer() {
		const container = document.createElement('div');
		container.classList.add(OverlayManager.CONTAINER_RECT_CLASS_NAME);
		return container;
	}

	private createElement() {
		const element = document.createElement('div');
		element.classList.add(OverlayManager.RECT_CLASS_NAME);
		this.container.appendChild(element);
		return element;
	}

	private createRectElement() {
		const rectInnerElement = document.createElement('div');
		rectInnerElement.classList.add(OverlayManager.RECT_INNER_CLASS_NAME);
		this.element.appendChild(rectInnerElement);
	}

	private createEditButton() {
		const editButton = document.createElement('button');
		editButton.type = 'button';
		editButton.classList.add(OverlayManager.RECT_BUTTON_CLASS_NAME);
		editButton.classList.add(OverlayManager.RECT_EDIT_BUTTON_CLASS_NAME);
		this.element.appendChild(editButton);
		return editButton;
	}

	private createAiButton() {
		const aiButton = document.createElement('button');
		aiButton.type = 'button';
		aiButton.classList.add(OverlayManager.RECT_BUTTON_CLASS_NAME);
		aiButton.classList.add(OverlayManager.RECT_AI_BUTTON_CLASS_NAME);
		this.element.appendChild(aiButton);
		return aiButton;
	}

	updateRect(rect: DOMRect) {
		const hasDimensions = rect.width !== 0 && rect.height !== 0;

		if (!this.hasNoDimensions && !hasDimensions) {
			this.hasNoDimensions = true;
			this.disable();
			return;
		}

		if (this.hasNoDimensions && hasDimensions) {
			this.hasNoDimensions = false;
			this.enable();
		}

		this.element.style.width = `${rect.width}px`;
		this.element.style.height = `${rect.height}px`;
		this.element.style.transform = `translate(${rect.left}px,${rect.top}px)`;
	}

	setCustomClass(customClass: string | undefined) {
		if (customClass === undefined) return;

		const isValidClassName = /^[a-zA-Z_][\w-]*$/.test(customClass);
		if (isValidClassName) this.container.classList.add(customClass);
	}

	toggleHover(hover: boolean) {
		this.element.classList.toggle(OverlayManager.RECT_HOVER_CLASS_NAME, hover);
	}

	toggleParentHover(hover: boolean) {
		this.element.classList.toggle(OverlayManager.RECT_PARENT_HOVER_CLASS_NAME, hover);
	}

	toggleHighlight(show: boolean) {
		this.element.classList.toggle(OverlayManager.RECT_HIGHLIGHT_CLASS_NAME, show);
	}

	toggleHighlightActive(show: boolean) {
		this.element.classList.toggle(OverlayManager.RECT_HIGHLIGHT_ACTIVE_CLASS_NAME, show);
	}

	disable() {
		this.element.style.display = 'none';
	}

	enable() {
		this.element.style.removeProperty('display');
	}

	remove() {
		this.container.remove();
	}
}
