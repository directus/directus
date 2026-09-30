import { Mark, mergeAttributes, Node } from '@tiptap/core';
import { afterEach, beforeEach, describe, expect, type MockInstance, test, vi } from 'vitest';
import { warnAsymmetricRichTexts } from './symmetry';

const Callout = Node.create({
	name: 'callout',
	group: 'block',
	content: 'block+',
	parseHTML: () => [{ tag: 'div[data-callout]' }],
	renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '' }), 0],
});

// renders an <aside> that its own parse rule never matches
const AsideCallout = Node.create({
	name: 'asideCallout',
	group: 'block',
	content: 'block+',
	parseHTML: () => [{ tag: 'div.callout' }],
	renderHTML: () => ['aside', { class: 'callout' }, 0],
});

const Heading7 = Node.create({
	name: 'heading7',
	group: 'block',
	content: 'inline*',
	parseHTML: () => [{ tag: 'div[data-h7]' }],
	renderHTML: () => ['h6', { 'data-h7': '' }, 0],
});

// core text-style parses every <span> first, so a span-based node must outrank it
const Emoji = Node.create({
	name: 'emoji',
	group: 'inline',
	inline: true,
	atom: true,
	parseHTML: () => [{ tag: 'span[data-emoji]', priority: 60 }],
	renderHTML: () => ['span', { 'data-emoji': '' }],
});

const BrokenEmoji = Node.create({
	name: 'brokenEmoji',
	group: 'inline',
	inline: true,
	atom: true,
	parseHTML: () => [{ tag: 'span[data-emoji]', priority: 60 }],
	renderHTML: () => ['i', { 'data-emoji': '' }],
});

const Kbd = Mark.create({
	name: 'kbd',
	parseHTML: () => [{ tag: 'kbd' }],
	renderHTML: ({ HTMLAttributes }) => ['kbd', mergeAttributes(HTMLAttributes), 0],
});

const Marker = Mark.create({
	name: 'marker',
	parseHTML: () => [{ tag: 'mark' }],
	renderHTML: () => ['span', { class: 'marker' }, 0],
});

// in no group, so it only exists inside a parent and has no sample of its own
const CalloutTitle = Node.create({
	name: 'calloutTitle',
	content: 'inline*',
	parseHTML: () => [{ tag: 'div[data-callout-title]' }],
	renderHTML: () => ['header', 0],
});

let warn: MockInstance<typeof console.warn>;

beforeEach(() => {
	warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => warn.mockRestore());

const warnings = () => warn.mock.calls.map(([message]) => String(message));

describe('warnAsymmetricRichTexts', () => {
	test('stays quiet for nodes and marks that round-trip', () => {
		warnAsymmetricRichTexts([{ id: 'good', name: 'Good', extensions: [Callout, Emoji, Kbd] }]);
		expect(warn).not.toHaveBeenCalled();
	});

	test('warns with the extension id and node name for an asymmetric block node', () => {
		warnAsymmetricRichTexts([{ id: 'aside', name: 'Aside', extensions: [AsideCallout] }]);

		expect(warnings()).toHaveLength(1);
		expect(warnings()[0]).toContain('Richtext extension "aside"');
		expect(warnings()[0]).toContain('node "asideCallout"');
		expect(warnings()[0]).toContain('<aside class="callout">');
	});

	// the HTML survives because core `heading` claims the <h6>, but the contributed node is gone
	test('warns when a core rule claims the markup a node writes', () => {
		warnAsymmetricRichTexts([{ id: 'h7', name: 'H7', extensions: [Heading7] }]);

		expect(warnings()).toEqual([expect.stringContaining('node "heading7"')]);
		expect(warnings()[0]).toContain('doc(heading("x")) instead of doc(heading7("x"))');
	});

	test('warns for an asymmetric inline node', () => {
		warnAsymmetricRichTexts([{ id: 'emoji', name: 'Emoji', extensions: [BrokenEmoji] }]);
		expect(warnings()).toEqual([expect.stringContaining('node "brokenEmoji"')]);
	});

	test('warns when the node survives but its HTML changes on the next save', () => {
		// a fresh node writes `data-kind` before `data-callout`, but parsing preserves `data-callout`,
		// and preserved attributes render first
		const KindCallout = Node.create({
			name: 'kindCallout',
			group: 'block',
			content: 'block+',
			addAttributes: () => ({
				kind: {
					default: 'info',
					parseHTML: (element) => element.getAttribute('data-kind'),
					renderHTML: (attributes) => ({ 'data-kind': attributes['kind'] }),
				},
			}),
			parseHTML: () => [{ tag: 'div[data-callout]' }],
			renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '' }), 0],
		});

		warnAsymmetricRichTexts([{ id: 'kind', name: 'Kind', extensions: [KindCallout] }]);
		expect(warnings()).toEqual([expect.stringContaining('saves back as')]);
	});

	test('warns for an asymmetric mark', () => {
		warnAsymmetricRichTexts([{ id: 'marker', name: 'Marker', extensions: [Marker] }]);
		expect(warnings()).toEqual([expect.stringContaining('mark "marker"')]);
	});

	test('warns for a span-based node that core text-style claims first', () => {
		const Tag = Node.create({
			name: 'tag',
			group: 'inline',
			inline: true,
			atom: true,
			parseHTML: () => [{ tag: 'span[data-tag]' }],
			renderHTML: () => ['span', { 'data-tag': '' }],
		});

		warnAsymmetricRichTexts([{ id: 'tag', name: 'Tag', extensions: [Tag] }]);
		expect(warnings()).toEqual([expect.stringContaining('node "tag"')]);
	});

	test('names each offending type once and only the offending ones', () => {
		warnAsymmetricRichTexts([
			{ id: 'mixed', name: 'Mixed', extensions: [Callout, AsideCallout, Kbd, Marker] },
			{ id: 'good', name: 'Good', extensions: [Emoji] },
		]);

		expect(warnings()).toEqual([
			expect.stringContaining('node "asideCallout"'),
			expect.stringContaining('mark "marker"'),
		]);
	});

	test('skips a node it cannot build a sample of', () => {
		warnAsymmetricRichTexts([{ id: 'title', name: 'Title', extensions: [CalloutTitle] }]);
		expect(warn).not.toHaveBeenCalled();
	});

	test('keeps checking the other types when one renderHTML throws', () => {
		const Throwing = Node.create({
			name: 'throwing',
			group: 'block',
			content: 'block+',
			parseHTML: () => [{ tag: 'div[data-throwing]' }],
			renderHTML: () => {
				throw new Error('boom');
			},
		});

		warnAsymmetricRichTexts([{ id: 'mixed', name: 'Mixed', extensions: [Throwing, AsideCallout] }]);
		expect(warnings()).toEqual([expect.stringContaining('node "asideCallout"')]);
	});

	test('skips a config without extensions', () => {
		warnAsymmetricRichTexts([{ id: 'buttons', name: 'Buttons only' }]);
		expect(warn).not.toHaveBeenCalled();
	});

	test('never throws when an extension breaks while building the schema', () => {
		const Broken = Node.create({
			name: 'broken',
			group: 'block',
			parseHTML: () => {
				throw new Error('boom');
			},
		});

		expect(() => warnAsymmetricRichTexts([{ id: 'broken', name: 'Broken', extensions: [Broken] }])).not.toThrow();
	});
});
