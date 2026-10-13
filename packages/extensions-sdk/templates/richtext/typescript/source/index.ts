import { defineRichText } from '@directus/extensions-sdk';
import { Mark, mergeAttributes } from '@tiptap/core';

const __EXTENSION_PASCAL_NAME__ = Mark.create({
	name: '__EXTENSION_CAMEL_NAME__',
	parseHTML: () => [{ tag: 'span[data-__EXTENSION_ID__]' }],
	renderHTML: ({ HTMLAttributes }) => ['span', mergeAttributes(HTMLAttributes, { 'data-__EXTENSION_ID__': '' }), 0],
});

export default defineRichText({
	id: '__EXTENSION_ID__',
	name: '__EXTENSION_NAME__',
	extensions: [__EXTENSION_PASCAL_NAME__],
	buttons: [
		{
			key: '__EXTENSION_ID__',
			icon: 'extension',
			label: '__EXTENSION_NAME__',
			command: (editor) => editor.chain().focus().toggleMark('__EXTENSION_CAMEL_NAME__').run(),
			isActive: (editor) => editor.isActive('__EXTENSION_CAMEL_NAME__'),
		},
	],
});
