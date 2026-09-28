import { Extension, Mark, mergeAttributes, Node } from '@tiptap/core';
import { Editor } from '@tiptap/vue-3';
import { afterEach, describe, expect, test } from 'vitest';
import { computeNormalizationDiff, computeValueNormalizationDiff } from './composables/normalization-diff';
import { buildFieldSchema, fieldEditorExtensions } from './extensions';
import { registerRichTexts } from '@/rich-text/register';

const Callout = Node.create({
	name: 'callout',
	group: 'block',
	content: 'block+',
	parseHTML: () => [{ tag: 'div[data-callout]' }],
	renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '' }), 0],
});

const Kbd = Mark.create({
	name: 'kbd',
	parseHTML: () => [{ tag: 'kbd' }],
	renderHTML: ({ HTMLAttributes }) => ['kbd', mergeAttributes(HTMLAttributes), 0],
});

const configs = [
	{ id: 'spike-callout', name: 'Callout', extensions: [Callout] },
	{ id: 'spike-kbd', name: 'Keyboard Key', extensions: [Kbd] },
];

const callout = '<div data-callout=""><p>hi</p></div>';
const kbd = '<p><kbd>K</kbd></p>';

// the live editor's schema, exactly as input-rich-text-html.vue builds it
function roundTrip(html: string, enabled?: string[]) {
	const editor = new Editor({
		extensions: fieldEditorExtensions(buildFieldSchema({ extensions: enabled }).extensions),
		content: html,
	});

	const out = editor.getHTML();
	editor.destroy();
	return out;
}

afterEach(() => registerRichTexts([]));

describe('per-field richtext extensions', () => {
	test('keeps the markup of an extension the field enabled', () => {
		registerRichTexts(configs);
		expect(roundTrip(callout, ['spike-callout'])).toBe(callout);
	});

	// the whole point of the field option: one field's schema is not the other's
	test('drops the markup of an extension the same field did not enable', () => {
		registerRichTexts(configs);
		expect(roundTrip(kbd, ['spike-callout'])).toBe('<p>K</p>');
	});

	test('enables several extensions at once', () => {
		registerRichTexts(configs);
		const out = roundTrip(callout + kbd, ['spike-callout', 'spike-kbd']);
		expect(out).toContain('data-callout');
		expect(out).toContain('<kbd>');
	});

	// installing an extension must not widen the schema of a field that never opted in
	test('drops everything when the field enabled nothing', () => {
		registerRichTexts(configs);
		expect(roundTrip(callout, [])).toBe('<p>hi</p>');
		expect(roundTrip(kbd)).toBe('<p>K</p>');
	});

	test('ignores an id no registered extension claims', () => {
		registerRichTexts(configs);
		expect(buildFieldSchema({ extensions: ['nope'] }).extensions).toHaveLength(0);
	});
});

const Tone = Extension.create({
	name: 'tone',
	addGlobalAttributes: () => [
		{
			types: ['paragraph'],
			attributes: {
				tone: {
					default: null,
					parseHTML: (element) => element.getAttribute('data-tone'),
					renderHTML: (attributes) => (attributes['tone'] ? { 'data-tone': attributes['tone'] } : {}),
				},
			},
		},
	],
});

const Badge = Node.create({
	name: 'badge',
	group: 'block',
	content: 'inline*',
	addAttributes: () => ({
		variant: {
			default: null,
			parseHTML: (element) => element.getAttribute('data-variant'),
			renderHTML: (attributes) => (attributes['variant'] ? { 'data-variant': attributes['variant'] } : {}),
		},
	}),
	parseHTML: () => [{ tag: 'div[data-badge]' }],
	renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, { 'data-badge': '' }), 0],
});

describe('data and aria attributes a contributed attribute owns', () => {
	const ownerConfigs = [
		{ id: 'spike-tone', name: 'Tone', extensions: [Tone] },
		{ id: 'spike-badge', name: 'Badge', extensions: [Badge] },
	];

	function editorFor(html: string, enabled: string[]) {
		return new Editor({
			extensions: fieldEditorExtensions(buildFieldSchema({ extensions: enabled }).extensions),
			content: html,
		});
	}

	test('leaves a name a global attribute parses to that attribute', () => {
		registerRichTexts(ownerConfigs);
		const editor = editorFor('<p data-x="1" data-tone="warm">hi</p>', ['spike-tone']);

		const attrs = editor.getJSON().content![0]!.attrs!;
		expect(attrs['tone']).toBe('warm');
		expect(attrs['dataAttributes']).toEqual({ 'data-x': '1' });
		editor.destroy();
	});

	// the case a second copy would break: the owner clears its value and the stale copy renders it back
	test('drops the name once the owner clears it', () => {
		registerRichTexts(ownerConfigs);
		const editor = editorFor('<p data-x="1" data-tone="warm">hi</p>', ['spike-tone']);

		editor.commands.updateAttributes('paragraph', { tone: null });
		expect(editor.getHTML()).toBe('<p data-x="1">hi</p>');
		editor.destroy();
	});

	test('leaves a name a node attribute parses to that attribute', () => {
		registerRichTexts(ownerConfigs);
		const editor = editorFor('<div data-badge="" data-variant="new">hi</div>', ['spike-badge']);

		editor.commands.setTextSelection(1);
		editor.commands.updateAttributes('badge', { variant: null });
		expect(editor.getHTML()).toContain('<div data-badge="">hi</div>');
		editor.destroy();
	});

	test('keeps the name as a preserved attribute when the field did not enable the owner', () => {
		registerRichTexts(ownerConfigs);
		expect(roundTrip('<p data-tone="warm">hi</p>', [])).toBe('<p data-tone="warm">hi</p>');
	});
});

describe('contributed toolbar buttons', () => {
	const button = { icon: 'info', label: 'Callout', command: () => {} };

	test('namespaces each button key by extension id', () => {
		registerRichTexts([{ id: 'spike-bold', name: 'Bold', buttons: [{ ...button, key: 'bold' }] }]);
		const { buttons } = buildFieldSchema({ extensions: ['spike-bold'] });

		expect(buttons.map((b) => b.key)).toEqual(['spike-bold:bold']);
		expect(buttons[0]!.command).toBe(button.command);
	});

	test('keeps the buttons of two extensions with the same bare key apart', () => {
		registerRichTexts([
			{ id: 'spike-a', name: 'A', buttons: [{ ...button, key: 'callout' }] },
			{ id: 'spike-b', name: 'B', buttons: [{ ...button, key: 'callout' }] },
		]);

		const { buttons } = buildFieldSchema({ extensions: ['spike-a', 'spike-b'] });
		expect(buttons.map((b) => b.key)).toEqual(['spike-a:callout', 'spike-b:callout']);
	});
});

// The save-time check and the comparison view re-parse the value through their own schema. Both
// take the same buildFieldSchema slice as the live editor, so a contributed node must never read
// as content loss there.
describe('contributed markup in the normalization checks', () => {
	test('the stored-value check stays silent for a node the field enabled', () => {
		registerRichTexts(configs);
		const { extensions, key } = buildFieldSchema({ extensions: ['spike-callout'] });

		expect(computeValueNormalizationDiff(callout, extensions, key)).toBeNull();
	});

	test('the stored-value check flags the same node for a field that did not enable it', () => {
		registerRichTexts(configs);
		const { extensions, key } = buildFieldSchema({ extensions: [] });

		expect(computeValueNormalizationDiff(callout, extensions, key)).not.toBeNull();
	});

	test('the comparison-mode check keeps both diff spans and contributed nodes', () => {
		registerRichTexts(configs);
		const { extensions, key } = buildFieldSchema({ extensions: ['spike-callout'], comparisonMode: true });
		const value = '<div data-callout=""><p><span class="comparison-diff--added">hi</span></p></div>';

		expect(computeValueNormalizationDiff(value, extensions, key)).toBeNull();
	});

	test('the source-code drawer check stays silent for a node the field enabled', () => {
		registerRichTexts(configs);
		const { extensions } = buildFieldSchema({ extensions: ['spike-kbd'] });

		expect(computeNormalizationDiff(kbd, extensions)).toBeNull();
	});

	// two fields with different slices must not share a cached verdict
	test('keeps the verdicts of two fields with different slices apart', () => {
		registerRichTexts(configs);
		const withCallout = buildFieldSchema({ extensions: ['spike-callout'] });
		const withKbd = buildFieldSchema({ extensions: ['spike-kbd'] });

		expect(computeValueNormalizationDiff(callout, withCallout.extensions, withCallout.key)).toBeNull();
		expect(computeValueNormalizationDiff(callout, withKbd.extensions, withKbd.key)).not.toBeNull();
	});
});
