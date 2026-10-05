import { Extension, Mark, mergeAttributes, Node } from '@tiptap/core';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { validateRichTexts } from './validate';

const Callout = Node.create({
	name: 'callout',
	group: 'block',
	content: 'block+',
	parseHTML: () => [{ tag: 'div[data-callout]' }],
	renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '' }), 0],
});

const button = { key: 'callout', icon: 'info', label: 'Callout', command: () => {} };

let error: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	error = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => error.mockRestore());

const ids = (configs: unknown[]) => validateRichTexts(configs).map((config) => config.id);

describe('validateRichTexts', () => {
	test('keeps a valid config', () => {
		expect(ids([{ id: 'callout', name: 'Callout', extensions: [Callout], buttons: [button] }])).toEqual(['callout']);
		expect(error).not.toHaveBeenCalled();
	});

	test('keeps the others when one is rejected', () => {
		const configs = [
			{ id: 'Bad Id', name: 'Bad' },
			{ id: 'callout', name: 'Callout', extensions: [Callout] },
		];

		expect(ids(configs)).toEqual(['callout']);
		expect(error).toHaveBeenCalledOnce();
	});

	test.each([
		['a non-object', 'nope'],
		['a missing id', { name: 'Callout' }],
		['a missing name', { id: 'callout' }],
		['a colon in the id', { id: 'a:b', name: 'Callout' }],
		['a non-array extensions', { id: 'callout', name: 'Callout', extensions: Callout }],
		['a non-Tiptap extension', { id: 'callout', name: 'Callout', extensions: [{ name: 'callout' }] }],
		['a non-array buttons', { id: 'callout', name: 'Callout', buttons: button }],
		['a button without a command', { id: 'callout', name: 'Callout', buttons: [{ ...button, command: undefined }] }],
		[
			'a button with a non-function isActive',
			{ id: 'callout', name: 'Callout', buttons: [{ ...button, isActive: 1 }] },
		],
		[
			'a button with a non-function isDisabled',
			{ id: 'callout', name: 'Callout', buttons: [{ ...button, isDisabled: true }] },
		],
		['a button without an icon', { id: 'callout', name: 'Callout', buttons: [{ ...button, icon: undefined }] }],
		['a button without a label', { id: 'callout', name: 'Callout', buttons: [{ ...button, label: undefined }] }],
		['a colon in a button key', { id: 'callout', name: 'Callout', buttons: [{ ...button, key: 'a:b' }] }],
		['a duplicate button key', { id: 'callout', name: 'Callout', buttons: [button, button] }],
	])('rejects %s', (_, config) => {
		expect(ids([config])).toEqual([]);
		expect(error).toHaveBeenCalledOnce();
	});

	test('rejects a later extension that reuses an id', () => {
		const configs = [
			{ id: 'callout', name: 'First' },
			{ id: 'callout', name: 'Second' },
		];

		expect(validateRichTexts(configs).map((config) => config.name)).toEqual(['First']);
		expect(error.mock.calls[0]!.join(' ')).toContain('"callout"');
	});

	test('rejects a node named after a core node and names the clash', () => {
		const Paragraph = Node.create({ name: 'paragraph', group: 'block', content: 'inline*' });

		expect(ids([{ id: 'my-paragraph', name: 'Paragraph', extensions: [Paragraph] }])).toEqual([]);

		const message = error.mock.calls[0]!.join(' ');
		expect(message).toContain('"my-paragraph"');
		expect(message).toContain('"paragraph"');
	});

	test('rejects a mark named after a core mark', () => {
		const Bold = Mark.create({ name: 'bold' });
		expect(ids([{ id: 'my-bold', name: 'Bold', extensions: [Bold] }])).toEqual([]);
	});

	test('rejects a core name nested inside addExtensions', () => {
		const Kit = Extension.create({
			name: 'myKit',
			addExtensions: () => [Node.create({ name: 'heading', group: 'block', content: 'inline*' })],
		});

		expect(ids([{ id: 'my-kit', name: 'Kit', extensions: [Kit] }])).toEqual([]);
	});

	test('rejects a name with the custom format prefix', () => {
		const Format = Mark.create({ name: 'customFormat_0' });
		expect(ids([{ id: 'my-format', name: 'Format', extensions: [Format] }])).toEqual([]);
	});

	test('rejects a later extension that reuses another extension name and names both', () => {
		const configs = [
			{ id: 'ext-a', name: 'A', extensions: [Callout] },
			{ id: 'ext-b', name: 'B', extensions: [Callout] },
		];

		expect(ids(configs)).toEqual(['ext-a']);

		const message = error.mock.calls[0]!.join(' ');
		expect(message).toContain('"ext-b"');
		expect(message).toContain('"callout"');
		expect(message).toContain('"ext-a"');
	});

	test('orders by id so the load order does not decide the conflict winner', () => {
		const configs = [
			{ id: 'ext-b', name: 'B', extensions: [Callout] },
			{ id: 'ext-c', name: 'C' },
			{ id: 'ext-a', name: 'A', extensions: [Callout] },
		];

		expect(ids(configs)).toEqual(['ext-a', 'ext-c']);
		expect(ids([...configs].reverse())).toEqual(['ext-a', 'ext-c']);
	});

	test('orders a config without a string id last instead of throwing', () => {
		expect(ids([{ name: 'No id' }, { id: 'callout', name: 'Callout' }])).toEqual(['callout']);
		expect(error).toHaveBeenCalledOnce();
	});

	test('does not reserve the names of a rejected extension', () => {
		const configs = [
			{ id: 'ext-a', name: 'A', extensions: [Callout], buttons: [button, button] },
			{ id: 'ext-b', name: 'B', extensions: [Callout] },
		];

		expect(ids(configs)).toEqual(['ext-b']);
	});

	test('rejects a global attribute that PreservedAttributes already owns', () => {
		const Classes = Extension.create({
			name: 'classes',
			addGlobalAttributes: () => [{ types: ['paragraph'], attributes: { class: { default: null } } }],
		});

		expect(ids([{ id: 'classes', name: 'Classes', extensions: [Classes] }])).toEqual([]);
		expect(error.mock.calls[0]!.join(' ')).toContain('"class"');
	});

	test('keeps a global attribute PreservedAttributes does not own', () => {
		const Tone = Extension.create({
			name: 'tone',
			addGlobalAttributes: () => [{ types: ['paragraph'], attributes: { tone: { default: null } } }],
		});

		expect(ids([{ id: 'tone', name: 'Tone', extensions: [Tone] }])).toEqual(['tone']);
	});

	test('rejects a global attribute a core type already defines and names both', () => {
		// a later definition wins in Tiptap's schema, so this would silently right-align every paragraph
		const Align = Extension.create({
			name: 'align',
			addGlobalAttributes: () => [{ types: ['heading', 'paragraph'], attributes: { textAlign: { default: 'right' } } }],
		});

		expect(ids([{ id: 'align', name: 'Align', extensions: [Align] }])).toEqual([]);

		const message = error.mock.calls[0]!.join(' ');
		expect(message).toContain('"textAlign"');
		expect(message).toContain('"heading"');
	});

	test('rejects a wildcard global attribute that a core type defines on its own', () => {
		const Level = Extension.create({
			name: 'level',
			addGlobalAttributes: () => [{ types: 'nodes', attributes: { level: { default: 1 } } }],
		});

		expect(ids([{ id: 'level', name: 'Level', extensions: [Level] }])).toEqual([]);
		expect(error.mock.calls[0]!.join(' ')).toContain('"heading"');
	});

	test('keeps a global attribute named after a core attribute when it only targets its own types', () => {
		const Align = Extension.create({
			name: 'calloutAlign',
			addGlobalAttributes: () => [{ types: ['callout'], attributes: { textAlign: { default: null } } }],
		});

		expect(ids([{ id: 'callout-align', name: 'Callout Align', extensions: [Callout, Align] }])).toEqual([
			'callout-align',
		]);
	});

	test('rejects a node attribute that PreservedAttributes already owns', () => {
		const ClassyCallout = Callout.extend({
			name: 'classyCallout',
			addAttributes: () => ({ class: { default: null } }),
		});

		expect(ids([{ id: 'classy', name: 'Classy', extensions: [ClassyCallout] }])).toEqual([]);
		expect(error.mock.calls[0]!.join(' ')).toContain('"class"');
	});

	test('rejects a mark attribute that PreservedAttributes already owns', () => {
		const Tag = Mark.create({ name: 'tag', addAttributes: () => ({ dataAttributes: { default: null } }) });

		expect(ids([{ id: 'tag', name: 'Tag', extensions: [Tag] }])).toEqual([]);
		expect(error.mock.calls[0]!.join(' ')).toContain('"dataAttributes"');
	});

	test('keeps a node attribute PreservedAttributes does not own', () => {
		const Variant = Callout.extend({ name: 'variantCallout', addAttributes: () => ({ variant: { default: 'info' } }) });

		expect(ids([{ id: 'variant', name: 'Variant', extensions: [Variant] }])).toEqual(['variant']);
	});

	describe('schema build', () => {
		test('rejects a node whose parseHTML throws and keeps the others', () => {
			const Broken = Callout.extend({
				name: 'brokenCallout',
				parseHTML: () => {
					throw new Error('boom');
				},
			});

			const configs = [
				{ id: 'broken', name: 'Broken', extensions: [Broken] },
				{ id: 'callout', name: 'Callout', extensions: [Callout] },
			];

			expect(ids(configs)).toEqual(['callout']);
			expect(error).toHaveBeenCalledOnce();
			expect(error.mock.calls[0]!.join(' ')).toContain('"broken"');
			expect(error.mock.calls[0]!.join(' ')).toContain('boom');
		});

		test('rejects a node whose content expression names an unknown node', () => {
			const Broken = Node.create({ name: 'brokenContent', group: 'block', content: 'nonexistent+' });
			expect(ids([{ id: 'broken', name: 'Broken', extensions: [Broken] }])).toEqual([]);
			expect(error.mock.calls[0]!.join(' ')).toContain('nonexistent');
		});
	});

	test('rejects an extension whose addExtensions throws', () => {
		const Broken = Extension.create({
			name: 'broken',
			addExtensions: () => {
				throw new Error('boom');
			},
		});

		expect(ids([{ id: 'broken', name: 'Broken', extensions: [Broken] }])).toEqual([]);
		expect(error).toHaveBeenCalledOnce();
	});
});

describe('button icons', () => {
	let warn: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => warn.mockRestore());

	const iconOf = (icon: string) =>
		validateRichTexts([{ id: 'callout', name: 'Callout', buttons: [{ ...button, icon }] }])[0]!.buttons![0]!.icon;

	test.each([
		['a Material icon', 'info'],
		['an app custom icon', 'format_align_justify_remove'],
		['a social icon', '500px'],
	])('keeps %s', (_, icon) => {
		expect(iconOf(icon)).toBe(icon);
		expect(warn).not.toHaveBeenCalled();
	});

	// an unknown name renders as its raw ligature text, so the extension loads with a placeholder icon
	test('replaces an unknown icon with the fallback and names the button', () => {
		expect(iconOf('not_an_icon')).toBe('extension');

		const message = warn.mock.calls[0]!.join(' ');
		expect(message).toContain('"callout"');
		expect(message).toContain('"not_an_icon"');
		expect(error).not.toHaveBeenCalled();
	});

	test('leaves the config the extension exported unchanged', () => {
		const config = { id: 'callout', name: 'Callout', buttons: [{ ...button, icon: 'not_an_icon' }] };
		validateRichTexts([config]);
		expect(config.buttons[0]!.icon).toBe('not_an_icon');
	});
});

describe('bubble menus', () => {
	const menu = { key: 'callout-menu', shouldShow: () => true, buttons: [button] };
	const withMenus = (bubbleMenus: unknown) => ({ id: 'callout', name: 'Callout', bubbleMenus });

	test('keeps a valid bubble menu', () => {
		expect(ids([withMenus([menu])])).toEqual(['callout']);
		expect(error).not.toHaveBeenCalled();
	});

	test.each([
		['a non-array bubbleMenus', menu],
		['a non-object menu', ['nope']],
		['a colon in a menu key', [{ ...menu, key: 'a:b' }]],
		['a duplicate menu key', [menu, menu]],
		['a menu without shouldShow', [{ ...menu, shouldShow: undefined }]],
		['a menu with non-array buttons', [{ ...menu, buttons: button }]],
		['a menu button without a command', [{ ...menu, buttons: [{ ...button, command: undefined }] }]],
		['a duplicate menu button key', [{ ...menu, buttons: [button, button] }]],
	])('rejects %s', (_, bubbleMenus) => {
		expect(ids([withMenus(bubbleMenus)])).toEqual([]);
		expect(error).toHaveBeenCalledOnce();
	});

	test('replaces an unknown menu button icon with the fallback', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const [config] = validateRichTexts([withMenus([{ ...menu, buttons: [{ ...button, icon: 'not_an_icon' }] }])]);

		expect(config!.bubbleMenus![0]!.buttons[0]!.icon).toBe('extension');
		expect(warn).toHaveBeenCalledOnce();
		warn.mockRestore();
	});
});

describe('menu buttons', () => {
	const item = { key: 'info', label: 'Info', command: () => {} };
	const menuButton = { key: 'tone', icon: 'palette', label: 'Tone', items: [item] };
	const withButton = (value: unknown) => ({ id: 'callout', name: 'Callout', buttons: [value] });

	test('keeps a valid menu button', () => {
		expect(ids([withButton({ ...menuButton, items: [{ ...item, icon: 'info', isActive: () => true }] })])).toEqual([
			'callout',
		]);

		expect(error).not.toHaveBeenCalled();
	});

	test.each([
		['a button with both command and items', { ...menuButton, command: () => {} }],
		['a button with neither command nor items', { ...menuButton, items: undefined }],
		['a non-array items', { ...menuButton, items: item }],
		['an empty items', { ...menuButton, items: [] }],
		['a non-object item', { ...menuButton, items: ['nope'] }],
		['a colon in an item key', { ...menuButton, items: [{ ...item, key: 'a:b' }] }],
		['a duplicate item key', { ...menuButton, items: [item, item] }],
		['an item without a label', { ...menuButton, items: [{ ...item, label: undefined }] }],
		['an item without a command', { ...menuButton, items: [{ ...item, command: undefined }] }],
		['an item with a non-string icon', { ...menuButton, items: [{ ...item, icon: 1 }] }],
		['an item with a non-function isActive', { ...menuButton, items: [{ ...item, isActive: true }] }],
		['an item with a non-function isDisabled', { ...menuButton, items: [{ ...item, isDisabled: true }] }],
	])('rejects %s', (_, value) => {
		expect(ids([withButton(value)])).toEqual([]);
		expect(error).toHaveBeenCalledOnce();
	});

	test('names the button and the item in the rejection', () => {
		ids([withButton({ ...menuButton, items: [{ ...item, command: undefined }] })]);
		const message = error.mock.calls[0]!.join(' ');
		expect(message).toContain('"tone"');
		expect(message).toContain('"info"');
	});

	test('rejects a menu button in a bubble menu', () => {
		const config = {
			id: 'callout',
			name: 'Callout',
			bubbleMenus: [{ key: 'menu', shouldShow: () => true, buttons: [menuButton] }],
		};

		expect(ids([config])).toEqual([]);
		expect(error.mock.calls[0]!.join(' ')).toContain('"tone"');
	});

	test('replaces an unknown item icon with the fallback', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const [config] = validateRichTexts([withButton({ ...menuButton, items: [{ ...item, icon: 'not_an_icon' }] })]);
		const button = config!.buttons![0]!;

		expect(button.items![0]!.icon).toBe('extension');
		expect(warn.mock.calls[0]!.join(' ')).toContain('"info"');
		warn.mockRestore();
	});
});
