import { defineInterface } from '@directus/utils';
import InterfaceInputRichTextMD from './input-rich-text-md.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'input-rich-text-md',
	name: '$t:interfaces.input-rich-text-md.markdown',
	description: '$t:interfaces.input-rich-text-md.description',
	icon: 'functions',
	component: InterfaceInputRichTextMD,
	types: ['text'],
	group: 'standard',
	preview: PreviewSVG,
	options: {
		standard: [
			{
				field: 'toolbar',
				name: '$t:interfaces.input-rich-text-html.toolbar',
				type: 'json',
				schema: {
					default_value: [
						'heading',
						'bold',
						'italic',
						'strikethrough',
						'bullist',
						'numlist',
						'blockquote',
						'code',
						'link',
						'table',
						'image',
						'empty',
					],
				},
				meta: {
					width: 'half',
					interface: 'select-multiple-dropdown',
					options: {
						choices: [
							{
								value: 'heading',
								text: '$t:wysiwyg_options.heading',
							},
							{
								value: 'bold',
								text: '$t:wysiwyg_options.bold',
							},
							{
								value: 'italic',
								text: '$t:wysiwyg_options.italic',
							},
							{
								value: 'strikethrough',
								text: '$t:wysiwyg_options.strikethrough',
							},
							{
								value: 'blockquote',
								text: '$t:wysiwyg_options.blockquote',
							},
							{
								value: 'bullist',
								text: '$t:wysiwyg_options.bullist',
							},
							{
								value: 'numlist',
								text: '$t:wysiwyg_options.numlist',
							},
							{
								value: 'table',
								text: '$t:wysiwyg_options.table',
							},
							{
								value: 'code',
								text: '$t:wysiwyg_options.source_code',
							},
							{
								value: 'image',
								text: '$t:wysiwyg_options.image',
							},
							{
								value: 'link',
								text: '$t:wysiwyg_options.link',
							},
						],
					},
				},
			},
			{
				field: 'placeholder',
				name: '$t:placeholder',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'system-input-translated-string',
					options: {
						placeholder: '$t:enter_a_placeholder',
					},
				},
			},
			{
				field: 'folder',
				name: '$t:interfaces.system-folder.folder',
				type: 'uuid',
				meta: {
					width: 'half',
					interface: 'system-folder',
					note: '$t:interfaces.system-folder.field_hint',
				},
			},
			{
				field: 'imageToken',
				name: '$t:interfaces.input-rich-text-md.imageToken',
				type: 'string',
				meta: {
					note: '$t:interfaces.input-rich-text-md.imageToken_label',
					width: 'half',
					interface: 'input',
				},
			},
		],
		advanced: [
			{
				field: 'softLength',
				name: '$t:soft_length',
				type: 'integer',
				meta: {
					width: 'half',
					interface: 'input',
					options: {
						placeholder: '255',
						min: 1,
					},
				},
			},
			{
				field: 'editorFont',
				name: '$t:interfaces.input-rich-text-md.editorFont',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{ text: '$t:sans_serif', value: 'sans-serif' },
							{ text: '$t:monospace', value: 'monospace' },
							{ text: '$t:serif', value: 'serif' },
						],
					},
				},
				schema: {
					default_value: 'sans-serif',
				},
			},
			{
				field: 'previewFont',
				name: '$t:interfaces.input-rich-text-md.previewFont',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{ text: '$t:sans_serif', value: 'sans-serif' },
							{ text: '$t:monospace', value: 'monospace' },
							{ text: '$t:serif', value: 'serif' },
						],
					},
				},
				schema: {
					default_value: 'sans-serif',
				},
			},
			{
				field: 'customSyntax',
				name: '$t:interfaces.input-rich-text-md.customSyntax',
				type: 'json',
				meta: {
					note: '$t:interfaces.input-rich-text-md.customSyntax_label',
					width: 'full',
					interface: 'list',
					options: {
						addLabel: '$t:interfaces.input-rich-text-md.customSyntax_add',
						template: '{{ name }}',
						fields: [
							{
								field: 'name',
								type: 'string',
								name: '$t:name',
								meta: {
									interface: 'input',
									width: 'half',
									options: {
										placeholder: '$t:name',
										default: null,
									},
								},
							},
							{
								field: 'icon',
								type: 'string',
								name: '$t:icon',
								meta: {
									interface: 'select-icon',
									width: 'half',
								},
							},
							{
								field: 'prefix',
								type: 'string',
								name: '$t:prefix',
								meta: {
									interface: 'input',
									width: 'half',
									options: {
										placeholder: '$t:prefix',
										default: null,
									},
								},
							},
							{
								field: 'suffix',
								type: 'string',
								name: '$t:suffix',
								meta: {
									interface: 'input',
									width: 'half',
									options: {
										placeholder: '$t:suffix',
										default: null,
									},
								},
							},
							{
								field: 'box',
								type: 'string',
								name: '$t:interfaces.input-rich-text-md.box',
								meta: {
									interface: 'select-radio',
									width: 'half',
									options: {
										choices: [
											{
												text: '$t:inline',
												value: 'inline',
											},
											{
												text: '$t:block',
												value: 'block',
											},
										],
									},
								},
								schema: {
									default_value: 'inline',
								},
							},
						],
					},
				},
			},
		],
	},
});
