import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apply, remove, disable, setAttr } from './index.ts';
import { DirectusFrame } from './lib/directus-frame.ts';
import { EditableStore } from './lib/editable-store.ts';
import type { EditConfig } from './lib/types/index.ts';

vi.mock('@reach/observe-rect', () => ({
	default: vi.fn(() => ({ observe: vi.fn(), unobserve: vi.fn() })),
}));

vi.mock('./lib/directus-frame.ts', () => ({
	DirectusFrame: vi.fn(),
}));

vi.mock('./lib/page-manager.ts', () => ({
	PageManager: { onNavigation: vi.fn() },
}));

function createEditableElement(config: EditConfig = { collection: 'articles', item: 1 }) {
	const el = document.createElement('div');
	el.dataset['directus'] = setAttr(config);
	document.body.appendChild(el);
	return el;
}

function setupFrame(overrides?: { connect?: boolean; confirm?: boolean; permittedKeys?: string[] }) {
	vi.mocked(DirectusFrame).mockImplementation(function (this: any) {
		Object.assign(this, {
			connect: vi.fn().mockReturnValue(overrides?.connect ?? true),
			receiveConfirm: vi.fn().mockResolvedValue(overrides?.confirm ?? true),
			send: vi.fn().mockImplementation((action: string, data?: any) => {
				if (action === 'checkFieldAccess' && Array.isArray(data)) {
					const keys = overrides?.permittedKeys ?? data.map((i: any) => i.key);
					EditableStore.activateItems(keys);
				}
			}),
			isAiEnabled: vi.fn().mockReturnValue(false),
		});
	});
}

beforeEach(() => {
	document.body.innerHTML = '';
	document.head.innerHTML = '';
	vi.clearAllMocks();
	setupFrame();

	vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
		width: 100,
		height: 50,
		top: 10,
		left: 10,
		right: 110,
		bottom: 60,
		x: 10,
		y: 10,
		toJSON: () => ({}),
	} as DOMRect);
});

afterEach(() => {
	remove();
	vi.restoreAllMocks();
});

describe('apply()', () => {
	it('returns undefined when connect() returns false', async () => {
		setupFrame({ connect: false });
		expect(await apply({ directusUrl: 'https://directus.example.com' })).toBeUndefined();
	});

	it('returns undefined when receiveConfirm() resolves false', async () => {
		setupFrame({ confirm: false });
		expect(await apply({ directusUrl: 'https://directus.example.com' })).toBeUndefined();
	});

	it('injects style into document.head', async () => {
		await apply({ directusUrl: 'https://directus.example.com' });
		expect(document.head.querySelector('#directus-visual-editing-style')).toBeInstanceOf(HTMLStyleElement);
	});

	it('applies customClass only to the specified element overlay', async () => {
		const el1 = createEditableElement({ collection: 'articles', item: 1 });
		createEditableElement({ collection: 'pages', item: 2 });

		await apply({ directusUrl: 'https://directus.example.com', elements: el1, customClass: 'my-class' });

		expect(document.querySelectorAll('.my-class').length).toBe(1);
		expect(document.querySelector('.directus-visual-editing-overlay.my-class')).toBeInstanceOf(HTMLElement);
	});

	describe('returned object', () => {
		it('contains a remove/enable/disable functions', async () => {
			createEditableElement();
			const result = await apply({ directusUrl: 'https://directus.example.com' });

			expect(typeof result?.remove).toBe('function');
			expect(typeof result?.enable).toBe('function');
			expect(typeof result?.disable).toBe('function');
		});

		describe('remove()', () => {
			it('removes scoped elements, leaving others intact', async () => {
				const el1 = createEditableElement({ collection: 'a', item: 1 });
				const el2 = createEditableElement({ collection: 'b', item: 2 });

				const result1 = await apply({ directusUrl: 'https://directus.example.com', elements: el1 });
				await apply({ directusUrl: 'https://directus.example.com', elements: el2 });

				result1?.remove();

				expect(document.querySelectorAll('.directus-visual-editing-overlay').length).toBe(1);
				expect(EditableStore.getItem(el1)).toBeUndefined();
				expect(EditableStore.getItem(el2)).toBeDefined();
			});
		});

		describe('disable() / enable()', () => {
			it('disable() hides overlay rect, enable() restores it', async () => {
				createEditableElement();
				const result = await apply({ directusUrl: 'https://directus.example.com' });
				const rect = document.querySelector('.directus-visual-editing-rect') as HTMLElement;

				result?.disable();
				expect(rect.style.display).toBe('none');

				result?.enable();
				expect(rect.style.display).toBe('');
			});
		});
	});
});

describe('remove()', () => {
	it('removes all editable elements and their overlays', async () => {
		createEditableElement({ collection: 'articles', item: 1 });
		createEditableElement({ collection: 'pages', item: 2 });
		await apply({ directusUrl: 'https://directus.example.com' });

		remove();

		expect(document.querySelectorAll('.directus-visual-editing-overlay').length).toBe(0);
	});
});

describe('disable()', () => {
	it('hides all overlays and returns enable()', async () => {
		createEditableElement();
		await apply({ directusUrl: 'https://directus.example.com' });
		const rect = document.querySelector('.directus-visual-editing-rect') as HTMLElement;

		const { enable } = disable();
		expect(rect.style.display).toBe('none');

		enable();
		expect(rect.style.display).toBe('');
	});
});

describe('setAttr()', () => {
	it('serializes collection and item', () => {
		expect(setAttr({ collection: 'articles', item: 123 })).toBe('collection:articles;item:123');
	});

	it('serializes fields array', () => {
		expect(setAttr({ collection: 'articles', item: 1, fields: ['title', 'body'] })).toBe(
			'collection:articles;item:1;fields:title,body',
		);
	});
});
