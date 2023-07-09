import { defineInterface } from '@directus/utils';
import { defineAsyncComponent } from 'vue';
import PreviewSVG from './preview.svg?raw';

const InterfaceWYSIWYG = defineAsyncComponent(() => import('./input-rich-text-html.vue'));

export default defineInterface({
	id: 'input-rich-text-html',
	name: '$t:interfaces.input-rich-text-html.wysiwyg',
	description: '$t:interfaces.input-rich-text-html.description',
	icon: 'format_quote',
	component: InterfaceWYSIWYG,
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
						'bold',
						'italic',
						'underline',
						'h1',
						'h2',
						'h3',
						'numlist',
						'bullist',
						'removeformat',
						'blockquote',
						'customLink',
						'customImage',
						'customMedia',
						'hr',
						'code',
						'fullscreen',
					],
				},
				meta: {
					width: 'half',
					interface: 'select-multiple-dropdown',
					options: {
						choices: [
							{
								value: 'undo',
								text: '$t:wysiwyg_options.undo',
							},
							{
								value: 'redo',
								text: '$t:wysiwyg_options.redo',
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
								value: 'underline',
								text: '$t:wysiwyg_options.underline',
							},
							{
								value: 'strikethrough',
								text: '$t:wysiwyg_options.strikethrough',
							},
							{
								value: 'subscript',
								text: '$t:wysiwyg_options.subscript',
							},
							{
								value: 'superscript',
								text: '$t:wysiwyg_options.superscript',
							},
							{
								value: 'fontfamily',
								text: '$t:wysiwyg_options.fontselect',
							},
							{
								value: 'fontsize',
								text: '$t:wysiwyg_options.fontsizeselect',
							},
							{
								value: 'h1',
								text: '$t:wysiwyg_options.h1',
							},
							{
								value: 'h2',
								text: '$t:wysiwyg_options.h2',
							},
							{
								value: 'h3',
								text: '$t:wysiwyg_options.h3',
							},
							{
								value: 'h4',
								text: '$t:wysiwyg_options.h4',
							},
							{
								value: 'h5',
								text: '$t:wysiwyg_options.h5',
							},
							{
								value: 'h6',
								text: '$t:wysiwyg_options.h6',
							},
							{
								value: 'alignleft',
								text: '$t:wysiwyg_options.alignleft',
							},
							{
								value: 'aligncenter',
								text: '$t:wysiwyg_options.aligncenter',
							},
							{
								value: 'alignright',
								text: '$t:wysiwyg_options.alignright',
							},
							{
								value: 'alignjustify',
								text: '$t:wysiwyg_options.alignjustify',
							},
							{
								value: 'alignnone',
								text: '$t:wysiwyg_options.alignnone',
							},
							{
								value: 'indent',
								text: '$t:wysiwyg_options.indent',
							},
							{
								value: 'outdent',
								text: '$t:wysiwyg_options.outdent',
							},
							{
								value: 'numlist',
								text: '$t:wysiwyg_options.numlist',
							},
							{
								value: 'bullist',
								text: '$t:wysiwyg_options.bullist',
							},
							{
								value: 'forecolor',
								text: '$t:wysiwyg_options.forecolor',
							},
							{
								value: 'backcolor',
								text: '$t:wysiwyg_options.backcolor',
							},
							{
								value: 'removeformat',
								text: '$t:wysiwyg_options.removeformat',
							},
							{
								value: 'cut',
								text: '$t:wysiwyg_options.cut',
							},
							{
								value: 'copy',
								text: '$t:wysiwyg_options.copy',
							},
							{
								value: 'paste',
								text: '$t:wysiwyg_options.paste',
							},
							{
								value: 'remove',
								text: '$t:wysiwyg_options.remove',
							},
							{
								value: 'selectall',
								text: '$t:wysiwyg_options.selectall',
							},
							{
								value: 'blockquote',
								text: '$t:wysiwyg_options.blockquote',
							},
							{
								value: 'customLink',
								text: '$t:wysiwyg_options.link',
							},
							{
								value: 'unlink',
								text: '$t:wysiwyg_options.unlink',
							},
							{
								value: 'customImage',
								text: '$t:wysiwyg_options.image',
							},
							{
								value: 'customMedia',
								text: '$t:wysiwyg_options.media',
							},
							{
								value: 'table',
								text: '$t:wysiwyg_options.table',
							},
							{
								value: 'hr',
								text: '$t:wysiwyg_options.hr',
							},
							{
								value: 'code',
								text: '$t:wysiwyg_options.source_code',
							},
							{
								value: 'fullscreen',
								text: '$t:wysiwyg_options.fullscreen',
							},
							{
								value: 'visualaid',
								text: '$t:wysiwyg_options.visualaid',
							},
							{
								value: 'ltr rtl',
								text: '$t:wysiwyg_options.directionality',
							},
						],
					},
				},
			},
			{
				field: 'font',
				name: '$t:font',
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
				field: 'folder',
				name: '$t:folder',
				type: 'uuid',
				meta: {
					width: 'half',
					interface: 'system-folder',
					note: '$t:interfaces.input-rich-text-html.folder_note',
				},
			},
			{
				field: 'imageToken',
				name: '$t:interfaces.input-rich-text-html.imageToken',
				type: 'string',
				meta: {
					note: '$t:interfaces.input-rich-text-html.imageToken_label',
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
				field: 'customFormats',
				name: '$t:interfaces.input-rich-text-html.custom_formats',
				type: 'json',
				meta: {
					interface: 'code',
					options: {
						language: 'json',
						template: JSON.stringify(
							[
								{
									title: 'My Custom Format',
									inline: 'span',
									classes: 'custom-wrapper',
									styles: { color: '#00ff00', 'font-size': '20px' },
									attributes: { title: 'My Custom Wrapper' },
								},
							],
							null,
							4
						),
					},
				},
			},
			{
				field: 'tinymceOverrides',
				name: '$t:interfaces.input-rich-text-html.options_override',
				type: 'json',
				meta: {
					interface: 'code',
					options: {
						language: 'json',
					},
				},
			},
		],
	},
});
