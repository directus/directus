import { EditableElement } from './editable-element.ts';

export class EditableStore {
	private static items: EditableElement[] = [];
	static highlightOverlayElements = false;
	private static highlightedKey: string | null = null;

	static getItem(element: Element) {
		return EditableStore.items.find((item) => item.element === element);
	}

	static getItemByKey(key: EditableElement['key']) {
		return EditableStore.items.find((item) => item.key === key);
	}

	static getItemByEditConfig(collection: string, item: string | number, fields?: string[]) {
		return EditableStore.items.find((i) => {
			if (i.editConfig.collection !== collection) return false;
			if (String(i.editConfig.item) !== String(item)) return false;

			const itemFields = i.editConfig.fields ?? [];
			const targetFields = fields ?? [];

			if (itemFields.length !== targetFields.length) return false;

			return itemFields.every((f) => targetFields.includes(f));
		});
	}

	static getHoveredItems() {
		return EditableStore.items.filter((item) => item.hover);
	}

	static addItem(item: EditableElement) {
		EditableStore.items.push(item);
	}

	static activateItems(keys: EditableElement['key'][]) {
		EditableStore.items.forEach((item) => {
			if (keys.includes(item.key)) item.activate();
		});
	}

	static enableItems(selectedItems?: EditableElement[]) {
		const items = selectedItems ?? EditableStore.items;

		items.forEach((item) => {
			item.disabled = false;
			item.rectObserver?.observe();
			item.overlayElement?.enable();
		});
	}

	static disableItems(selectedItems?: EditableElement[]) {
		const items = selectedItems ?? EditableStore.items.filter((item) => !item.disabled);

		items.forEach((item) => {
			item.disabled = true;
			item.hover = false;
			item.rectObserver?.unobserve();
			item.overlayElement?.disable();
		});

		return [...items];
	}

	static removeItems(selectedItems?: EditableElement[]) {
		const items = selectedItems ?? EditableStore.items;

		items.forEach((item) => {
			item.rectObserver?.unobserve();
			item.overlayElement?.remove();
			item.removeHoverListener();
		});

		EditableStore.items = EditableStore.items.filter((item) => !items.includes(item));
	}

	static highlightItems(show: boolean) {
		if (this.highlightOverlayElements === show) return;

		this.highlightOverlayElements = show;

		EditableStore.items.forEach((item) => {
			item.overlayElement?.toggleHighlight(show);
		});
	}

	static highlightElement(
		identifier: { key: string } | { collection: string; item: string | number; fields?: string[] } | null,
	) {
		if (this.highlightedKey !== null) {
			EditableStore.getItemByKey(this.highlightedKey)?.overlayElement?.toggleHighlightActive(false);
		}

		if (identifier === null) {
			this.highlightedKey = null;
			return;
		}

		let element: EditableElement | undefined;

		if ('key' in identifier) {
			element = EditableStore.getItemByKey(identifier.key);
		} else {
			element = EditableStore.getItemByEditConfig(identifier.collection, identifier.item, identifier.fields);
		}

		if (element) {
			this.highlightedKey = element.key;
			element.overlayElement?.toggleHighlightActive(true);
		} else {
			this.highlightedKey = null;
		}
	}
}
