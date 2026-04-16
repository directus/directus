import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EditableElement } from './editable-element.ts';
import { EditableStore } from './editable-store.ts';
import { setAttr } from '../index.ts';
import type { EditConfig } from './types/index.ts';

const mockObserve = vi.fn();
const mockUnobserve = vi.fn();

vi.mock('@reach/observe-rect', () => ({
	default: vi.fn(() => ({
		observe: mockObserve,
		unobserve: mockUnobserve,
	})),
}));

const mockSend = vi.fn();
const mockIsAiEnabled = vi.fn().mockReturnValue(false);

vi.mock('./directus-frame.ts', () => ({
	DirectusFrame: vi.fn(function (this: { send: typeof mockSend; isAiEnabled: () => boolean }) {
		this.send = mockSend;
		this.isAiEnabled = mockIsAiEnabled;
	}),
}));

function createEditableElement(config: EditConfig = { collection: 'articles', item: '1' }) {
	const el = document.createElement('div');
	el.dataset['directus'] = setAttr(config);
	document.body.appendChild(el);
	return el;
}

describe('EditableElement', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
		document.head.innerHTML = '';

		mockSend.mockReset();
		mockIsAiEnabled.mockReturnValue(false);
		mockObserve.mockClear();
		mockUnobserve.mockClear();

		EditableStore.removeItems();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('calls rectObserver.observe() when activate() is called', () => {
		const editable = new EditableElement(createEditableElement());
		editable.activate();
		expect(mockObserve).toHaveBeenCalledOnce();
	});

	it('parses editConfig from data-directus attribute', () => {
		const editConfig: EditConfig = { collection: 'articles', item: '123', fields: ['title', 'body'], mode: 'drawer' };
		const el = createEditableElement(editConfig);
		const editable = new EditableElement(el);

		expect(editable.editConfig).toEqual(editConfig);
	});

	it('sends "edit" action with key, editConfig and rect when edit button is clicked', () => {
		const el = createEditableElement({ collection: 'articles', item: '42', fields: ['title'] });
		const editable = new EditableElement(el);
		editable.activate();

		editable.overlayElement!.editButton.click();

		expect(mockSend).toHaveBeenCalledOnce();

		expect(mockSend).toHaveBeenCalledWith('edit', {
			key: editable.key,
			editConfig: editable.editConfig,
			rect: editable.rect,
		});
	});

	it('sends "addToContext" action with key, editConfig and rect when AI button is clicked', () => {
		mockIsAiEnabled.mockReturnValue(true);
		const el = createEditableElement({ collection: 'articles', item: '42', fields: ['title'] });
		const editable = new EditableElement(el);
		editable.activate();

		editable.overlayElement!.aiButton!.click();

		expect(mockSend).toHaveBeenCalledOnce();

		expect(mockSend).toHaveBeenCalledWith('addToContext', {
			key: editable.key,
			editConfig: editable.editConfig,
			rect: editable.rect,
		});
	});

	it('sets hover to true on mouseenter and false on mouseleave', () => {
		const el = createEditableElement();
		const editable = new EditableElement(el);
		editable.activate();
		EditableStore.addItem(editable);

		el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
		expect(editable.hover).toBe(true);

		el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
		expect(editable.hover).toBe(false);
	});

	describe('setParentsHover()', () => {
		let parent: HTMLElement;
		let child: HTMLElement;

		beforeEach(() => {
			parent = document.createElement('div');
			parent.dataset['directus'] = 'collection:pages;item:1';
			child = document.createElement('div');
			child.dataset['directus'] = 'collection:articles;item:2';
			parent.appendChild(child);
			document.body.appendChild(parent);

			const parentItem = new EditableElement(parent);
			parentItem.activate();
			EditableStore.addItem(parentItem);

			const childItem = new EditableElement(child);
			childItem.activate();
			EditableStore.addItem(childItem);
		});

		it('marks parent overlay with parent-hover class when child is hovered', () => {
			parent.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
			child.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));

			expect(document.querySelectorAll('.directus-visual-editing-rect-parent-hover')).toHaveLength(1);
		});

		it('removes parent-hover class when child is unhovered', () => {
			parent.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
			child.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
			child.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));

			expect(document.querySelectorAll('.directus-visual-editing-rect-parent-hover')).toHaveLength(0);
		});
	});

	describe('removeHoverListener()', () => {
		it('prevents mouseenter from firing after removeHoverListener is called', () => {
			const el = createEditableElement();
			const editable = new EditableElement(el);
			editable.activate();
			EditableStore.addItem(editable);

			editable.removeHoverListener();
			el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));

			expect(editable.hover).toBe(false);
		});

		it('prevents mouseleave from firing after removeHoverListener is called', () => {
			const el = createEditableElement();
			const editable = new EditableElement(el);
			editable.activate();
			EditableStore.addItem(editable);

			el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
			editable.removeHoverListener();

			el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));

			expect(editable.hover).toBe(true);
		});
	});

	describe('applyOptions()', () => {
		it('sets onSaved callback', () => {
			const editable = new EditableElement(createEditableElement());
			const callback = vi.fn();

			editable.applyOptions({ onSaved: callback });

			expect(editable.onSaved).toBe(callback);
		});

		it('sets optionsWritable to false when elementsSpecified is true', () => {
			const editable = new EditableElement(createEditableElement());
			const callback1 = vi.fn();
			const callback2 = vi.fn();

			editable.applyOptions({ onSaved: callback1 }, true);
			editable.applyOptions({ onSaved: callback2 }, false);

			expect(editable.onSaved).toBe(callback1);
		});

		it('applies customClass set before activate() once the overlay is created', () => {
			const editable = new EditableElement(createEditableElement());

			editable.applyOptions({ customClass: 'my-class' });
			editable.activate();

			expect(document.querySelector('.directus-visual-editing-overlay.my-class')).toBeInstanceOf(HTMLElement);
		});
	});

	describe('query()', () => {
		it.each([undefined, null])('returns all [data-directus] elements when called with %s', (elements) => {
			const el1 = createEditableElement({ collection: 'a', item: '1' });
			const el2 = createEditableElement({ collection: 'b', item: '2' });
			const result = EditableElement.query(elements);

			expect(result).toHaveLength(2);
			expect(result).toContain(el1);
			expect(result).toContain(el2);
		});

		it('returns element itself when it has data-directus', () => {
			const el = createEditableElement();
			const result = EditableElement.query(el);

			expect(result).toHaveLength(1);
			expect(result[0]).toBe(el);
		});

		it('returns children with data-directus when parent lacks the attribute', () => {
			const parent = document.createElement('div');
			const child1 = document.createElement('div');
			child1.dataset['directus'] = 'collection:a;item:1';
			const child2 = document.createElement('div');
			child2.dataset['directus'] = 'collection:b;item:2';
			parent.append(child1, child2);

			const result = EditableElement.query(parent);
			expect(result).toHaveLength(2);
			expect(result).toContain(child1);
			expect(result).toContain(child2);
		});

		it('handles array of elements', () => {
			const el1 = createEditableElement({ collection: 'a', item: '1' });
			const el2 = createEditableElement({ collection: 'b', item: '2' });

			const result = EditableElement.query([el1, el2]);
			expect(result).toHaveLength(2);
			expect(result).toContain(el1);
			expect(result).toContain(el2);
		});
	});

	describe('editAttrToObject()', () => {
		it('parses fields as array', () => {
			const editable = new EditableElement(
				createEditableElement({ collection: 'articles', item: '1', fields: ['title', 'body', 'slug'] }),
			);

			expect(editable.editConfig.fields).toEqual(['title', 'body', 'slug']);
		});

		it('trims whitespace from values', () => {
			const el = document.createElement('div');
			el.dataset['directus'] = 'collection: articles ; item: 123 ';
			const editable = new EditableElement(el);

			expect(editable.editConfig.collection).toBe('articles');
			expect(editable.editConfig.item).toBe('123');
		});

		it('ignores unknown keys', () => {
			const el = document.createElement('div');
			el.dataset['directus'] = 'collection:articles;item:1;invalid:value;foo:bar';
			const editable = new EditableElement(el);

			expect(editable.editConfig).toEqual({ collection: 'articles', item: '1' });
		});

		it('handles empty/malformed pairs without throwing', () => {
			const el = document.createElement('div');
			el.dataset['directus'] = 'collection:articles;;item:1;';
			const editable = new EditableElement(el);

			expect(editable.editConfig.collection).toBe('articles');
			expect(editable.editConfig.item).toBe('1');
		});

		it('parses mode value', () => {
			const editable = new EditableElement(
				createEditableElement({ collection: 'articles', item: '1', mode: 'popover' }),
			);

			expect(editable.editConfig.mode).toBe('popover');
		});
	});
});
