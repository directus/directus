import { defineRichText } from '@directus/extensions-sdk';
import { Mark, mergeAttributes } from '@tiptap/core';

const Custom = Mark.create({
	name: 'custom',
	// outranks the editor's TextStyle mark, which otherwise claims any span with a data-* attribute
	priority: 200,
	parseHTML: () => [{ tag: 'span[data-custom]' }],
	renderHTML: ({ HTMLAttributes }) => ['span', mergeAttributes(HTMLAttributes, { 'data-custom': '' }), 0],
});

export default defineRichText({
	id: 'custom',
	name: 'Custom',
	extensions: [Custom],
	buttons: [
		{
			key: 'custom',
			icon: 'extension',
			label: 'Custom',
			command: (editor) => editor.chain().focus().toggleMark('custom').run(),
			isActive: (editor) => editor.isActive('custom'),
		},
	],
});
