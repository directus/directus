import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EditableStore } from './editable-store.ts';
import { EditableElement } from './editable-element.ts';
import { setAttr } from '../index.ts';
import type { EditConfig } from './types/index.ts';

vi.mock('@reach/observe-rect', () => ({
	default: vi.fn(() => ({
		observe: vi.fn(),
		unobserve: vi.fn(),
	})),
}));

vi.mock('./directus-frame.ts', () => ({
	DirectusFrame: vi.fn(function (this: { isAiEnabled: () => boolean; send: () => void }) {
		this.isAiEnabled = () => false;
		this.send = vi.fn();
	}),
}));

function createEditableElement(config: EditConfig = { collection: 'articles', item: '1' }): EditableElement {
	const el = document.createElement('div');
	el.dataset['directus'] = setAttr(config);
	document.body.appendChild(el);
	const item = new EditableElement(el);
	item.activate();
	return item;
}

describe('EditableStore', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
		document.head.innerHTML = '';
		EditableStore.removeItems();
		EditableStore.highlightOverlayElements = false;
		EditableStore.highlightElement(null);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('adds item via addItem() and retrieves it via getItem() by element reference', () => {
		const item = createEditableElement({ collection: 'articles', item: '1' });

		EditableStore.addItem(item);

		expect(EditableStore.getItem(item.element)).toBe(item);
	});

	it('returns undefined when calling getItem() for an element not in the store', () => {
		const el = document.createElement('div');

		expect(EditableStore.getItem(el)).toBeUndefined();
	});

	describe('getItemByKey()', () => {
		it('finds item by its uuid key', () => {
			const item = createEditableElement({ collection: 'articles', item: '1' });
			EditableStore.addItem(item);

			expect(EditableStore.getItemByKey(item.key)).toBe(item);
		});

		it('returns undefined for a key not in the store', () => {
			expect(EditableStore.getItemByKey('0000')).toBeUndefined();
		});

		it('returns undefined after the item is removed', () => {
			const item = createEditableElement({ collection: 'articles', item: '1' });
			EditableStore.addItem(item);
			EditableStore.removeItems([item]);

			expect(EditableStore.getItemByKey(item.key)).toBeUndefined();
		});
	});

	describe('getItemByEditConfig()', () => {
		it('finds item by collection and item id', () => {
			const item = createEditableElement({ collection: 'articles', item: 123 });
			EditableStore.addItem(item);

			expect(EditableStore.getItemByEditConfig('articles', '123')).toBe(item);
		});

		it('finds item with matching fields regardless of query order', () => {
			const item = createEditableElement({ collection: 'articles', item: '1', fields: ['title', 'body'] });
			EditableStore.addItem(item);

			expect(EditableStore.getItemByEditConfig('articles', '1', ['body', 'title'])).toBe(item);
		});

		it('returns undefined when field counts differ', () => {
			const itemFewer = createEditableElement({ collection: 'articles', item: '1', fields: ['title'] });
			const itemMore = createEditableElement({ collection: 'articles', item: '2', fields: ['title', 'body'] });
			EditableStore.addItem(itemFewer);
			EditableStore.addItem(itemMore);

			expect(EditableStore.getItemByEditConfig('articles', '1', ['title', 'body'])).toBeUndefined();
			expect(EditableStore.getItemByEditConfig('articles', '2', ['title'])).toBeUndefined();
		});

		it('item with no fields specified matches query with empty fields array', () => {
			const item = createEditableElement({ collection: 'articles', item: '1' });
			EditableStore.addItem(item);

			expect(EditableStore.getItemByEditConfig('articles', '1', [])).toBe(item);
		});

		it('item with no fields specified matches query with undefined fields', () => {
			const item = createEditableElement({ collection: 'articles', item: '1' });
			EditableStore.addItem(item);

			expect(EditableStore.getItemByEditConfig('articles', '1')).toBe(item);
		});
	});

	it('returns only items with hover=true when calling getHoveredItems()', () => {
		const item1 = createEditableElement({ collection: 'a', item: '1' });
		const item2 = createEditableElement({ collection: 'b', item: '2' });
		const item3 = createEditableElement({ collection: 'c', item: '3' });
		item1.hover = true;
		item3.hover = true;
		EditableStore.addItem(item1);
		EditableStore.addItem(item2);
		EditableStore.addItem(item3);

		const result = EditableStore.getHoveredItems();

		expect(result).toHaveLength(2);
		expect(result).toContain(item1);
		expect(result).toContain(item3);
		expect(result).not.toContain(item2);
	});

	describe('activateItems()', () => {
		it('calls activate() on items whose key is in the list', () => {
			const item1 = createEditableElement({ collection: 'a', item: '1' });
			const item2 = createEditableElement({ collection: 'b', item: '2' });
			EditableStore.addItem(item1);
			EditableStore.addItem(item2);

			const spy1 = vi.spyOn(item1, 'activate');
			const spy2 = vi.spyOn(item2, 'activate');

			EditableStore.activateItems([item1.key]);

			expect(spy1).toHaveBeenCalledOnce();
			expect(spy2).not.toHaveBeenCalled();
		});

		it('skips items whose key is not in the list', () => {
			const item = createEditableElement({ collection: 'a', item: '1' });
			EditableStore.addItem(item);

			const spy = vi.spyOn(item, 'activate');

			EditableStore.activateItems(['non-existent-key']);

			expect(spy).not.toHaveBeenCalled();
		});

		it('silently skips items not in the store', () => {
			const item = createEditableElement({ collection: 'a', item: '1' });
			EditableStore.addItem(item);
			EditableStore.removeItems([item]);

			expect(() => EditableStore.activateItems([item.key])).not.toThrow();
		});
	});

	describe('enableItems()', () => {
		it('enables all store items when called without arguments', () => {
			const item1 = createEditableElement({ collection: 'a', item: '1' });
			const item2 = createEditableElement({ collection: 'b', item: '2' });
			item1.disabled = true;
			item2.disabled = true;
			EditableStore.addItem(item1);
			EditableStore.addItem(item2);

			EditableStore.enableItems();

			expect(item1.disabled).toBe(false);
			expect(item2.disabled).toBe(false);
		});

		it('enables only the selected items', () => {
			const item1 = createEditableElement({ collection: 'a', item: '1' });
			const item2 = createEditableElement({ collection: 'b', item: '2' });
			item1.disabled = true;
			item2.disabled = true;
			EditableStore.addItem(item1);
			EditableStore.addItem(item2);

			EditableStore.enableItems([item1]);

			expect(item1.disabled).toBe(false);
			expect(item2.disabled).toBe(true);
		});

		it('calls rectObserver.observe on each enabled item', () => {
			const item = createEditableElement({ collection: 'a', item: '1' });
			item.disabled = true;
			EditableStore.addItem(item);

			const spy = vi.spyOn(item.rectObserver!, 'observe');
			spy.mockClear();

			EditableStore.enableItems([item]);

			expect(spy).toHaveBeenCalledOnce();
		});
	});

	describe('disableItems()', () => {
		it('disables all non-disabled items when called without arguments', () => {
			const item1 = createEditableElement({ collection: 'a', item: '1' });
			const item2 = createEditableElement({ collection: 'b', item: '2' });
			item1.hover = true;
			EditableStore.addItem(item1);
			EditableStore.addItem(item2);

			EditableStore.disableItems();

			expect(item1.disabled).toBe(true);
			expect(item1.hover).toBe(false);
			expect(item2.disabled).toBe(true);
			expect(item2.hover).toBe(false);
		});

		it('disables only the selected items', () => {
			const item1 = createEditableElement({ collection: 'a', item: '1' });
			const item2 = createEditableElement({ collection: 'b', item: '2' });
			item1.hover = true;
			EditableStore.addItem(item1);
			EditableStore.addItem(item2);

			EditableStore.disableItems([item1]);

			expect(item1.disabled).toBe(true);
			expect(item1.hover).toBe(false);
			expect(item2.disabled).toBe(false);
		});

		it('skips already-disabled items when called without arguments', () => {
			const item1 = createEditableElement({ collection: 'a', item: '1' });
			const item2 = createEditableElement({ collection: 'b', item: '2' });
			item1.disabled = true;
			EditableStore.addItem(item1);
			EditableStore.addItem(item2);

			const result = EditableStore.disableItems();

			expect(result).toHaveLength(1);
			expect(result[0]).toBe(item2);
		});

		it('calls rectObserver.unobserve on each disabled item', () => {
			const item = createEditableElement({ collection: 'a', item: '1' });
			EditableStore.addItem(item);
			const spy = vi.spyOn(item.rectObserver!, 'unobserve');

			EditableStore.disableItems([item]);

			expect(spy).toHaveBeenCalledOnce();
		});
	});

	describe('removeItems()', () => {
		it('removes all items from the store when called without arguments', () => {
			const item1 = createEditableElement({ collection: 'a', item: '1' });
			const item2 = createEditableElement({ collection: 'b', item: '2' });
			EditableStore.addItem(item1);
			EditableStore.addItem(item2);

			EditableStore.removeItems();

			expect(EditableStore.getItem(item1.element)).toBeUndefined();
			expect(EditableStore.getItem(item2.element)).toBeUndefined();
		});

		it('removes only the selected items, leaving others in the store', () => {
			const item1 = createEditableElement({ collection: 'a', item: '1' });
			const item2 = createEditableElement({ collection: 'b', item: '2' });
			EditableStore.addItem(item1);
			EditableStore.addItem(item2);

			EditableStore.removeItems([item1]);

			expect(EditableStore.getItem(item1.element)).toBeUndefined();
			expect(EditableStore.getItem(item2.element)).toBe(item2);
		});

		it('calls rectObserver.unobserve on each removed item', () => {
			const item = createEditableElement({ collection: 'a', item: '1' });
			EditableStore.addItem(item);
			const spy = vi.spyOn(item.rectObserver!, 'unobserve');

			EditableStore.removeItems([item]);

			expect(spy).toHaveBeenCalledOnce();
		});

		it('calls removeHoverListener on each removed item', () => {
			const item = createEditableElement({ collection: 'a', item: '1' });
			EditableStore.addItem(item);
			const spy = vi.spyOn(item, 'removeHoverListener');

			EditableStore.removeItems([item]);

			expect(spy).toHaveBeenCalledOnce();
		});
	});

	it('toggles highlightOverlayElements when highlightItems() is called', () => {
		EditableStore.highlightItems(true);
		expect(EditableStore.highlightOverlayElements).toBe(true);

		EditableStore.highlightItems(false);
		expect(EditableStore.highlightOverlayElements).toBe(false);
	});

	describe('highlightElement()', () => {
		it('calls toggleHighlightActive when highlighting by key', () => {
			const item = createEditableElement({ collection: 'a', item: '1' });
			EditableStore.addItem(item);
			const spy = vi.spyOn(item.overlayElement!, 'toggleHighlightActive');

			EditableStore.highlightElement({ key: item.key });

			expect(spy).toHaveBeenCalledOnce();
			expect(spy).toHaveBeenCalledWith(true);
		});

		it('calls toggleHighlightActive when highlighting by collection and item', () => {
			const item = createEditableElement({ collection: 'articles', item: '123' });
			EditableStore.addItem(item);
			const spy = vi.spyOn(item.overlayElement!, 'toggleHighlightActive');

			EditableStore.highlightElement({ collection: 'articles', item: '123' });

			expect(spy).toHaveBeenCalledOnce();
			expect(spy).toHaveBeenCalledWith(true);
		});

		it('clears the previous highlight before activating the new one', () => {
			const item1 = createEditableElement({ collection: 'a', item: '1' });
			const item2 = createEditableElement({ collection: 'b', item: '2' });
			EditableStore.addItem(item1);
			EditableStore.addItem(item2);

			const spy1 = vi.spyOn(item1.overlayElement!, 'toggleHighlightActive');
			const spy2 = vi.spyOn(item2.overlayElement!, 'toggleHighlightActive');

			EditableStore.highlightElement({ key: item1.key });
			EditableStore.highlightElement({ key: item2.key });

			expect(spy1).toHaveBeenCalledWith(true);
			expect(spy1).toHaveBeenCalledWith(false);
			expect(spy2).toHaveBeenCalledWith(true);
		});

		it('clears the active highlight when passing null', () => {
			const item = createEditableElement({ collection: 'a', item: '1' });
			EditableStore.addItem(item);

			const spy = vi.spyOn(item.overlayElement!, 'toggleHighlightActive');

			EditableStore.highlightElement({ key: item.key });
			EditableStore.highlightElement(null);

			expect(spy).toHaveBeenCalledWith(false);
		});
	});
});
