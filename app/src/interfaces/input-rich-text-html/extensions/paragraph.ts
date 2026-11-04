import Paragraph from '@tiptap/extension-paragraph';
import type { Schema } from '@tiptap/pm/model';
import { hasPreservedAttributes } from './preserved-attributes';

// prosemirror-model's own blockTags: the parser closes a paragraph at these even when no node models them
const PARSER_BLOCK_TAGS = [
	'address',
	'article',
	'aside',
	'blockquote',
	'canvas',
	'dd',
	'div',
	'dl',
	'fieldset',
	'figcaption',
	'figure',
	'footer',
	'form',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'header',
	'hgroup',
	'hr',
	'li',
	'noscript',
	'ol',
	'output',
	'p',
	'pre',
	'section',
	'table',
	'tfoot',
	'ul',
];

const blockSelectors = new WeakMap<Schema, string>();

function blockSelector(schema: Schema | undefined): string {
	// getSchema() builds without an editor, so only the parser's own block tags apply there
	if (!schema) return PARSER_BLOCK_TAGS.join(',');

	let selector = blockSelectors.get(schema);

	if (selector === undefined) {
		const schemaTags = Object.values(schema.nodes)
			.filter((type) => type.isBlock)
			.flatMap((type) => (type.spec.parseDOM ?? []).flatMap((rule) => (rule.tag ? [rule.tag] : [])));

		selector = Array.from(new Set([...PARSER_BLOCK_TAGS, ...schemaTags])).join(',');
		blockSelectors.set(schema, selector);
	}

	return selector;
}

function hasParagraphAttributes(element: HTMLElement): boolean {
	return hasPreservedAttributes(element) || Boolean(element.style.textAlign);
}

/** Parses a `<div>` with paragraph attributes and only inline content as a `<p>`, so those attributes survive. */
export const CustomParagraph = Paragraph.extend({
	parseHTML() {
		const editor = this.editor;

		return [
			...(this.parent?.() ?? []),
			{
				tag: 'div',
				// below the default 50, so page breaks and contributed `div` rules at default priority match first
				priority: 10,
				getAttrs: (element) =>
					hasParagraphAttributes(element) && !element.querySelector(blockSelector(editor?.schema)) ? null : false,
			},
		];
	},
});
