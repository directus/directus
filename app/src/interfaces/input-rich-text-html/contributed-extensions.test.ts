import { Mark, mergeAttributes, Node } from '@tiptap/core';
import { Editor } from '@tiptap/vue-3';
import { afterEach, describe, expect, test } from 'vitest';
import { computeNormalizationDiff, computeValueNormalizationDiff } from './composables/normalization-diff';
import { buildFieldSchema, editorExtensions } from './extensions';
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

// the live editor's schema: editorExtensions plus the field slice, exactly as input-rich-text-html.vue builds it
function roundTrip(html: string, enabled?: string[]) {
	const editor = new Editor({
		extensions: [...editorExtensions, ...buildFieldSchema({ extensions: enabled }).extensions],
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
