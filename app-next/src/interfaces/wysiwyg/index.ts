import { AsyncComponent } from 'vue';
import { defineInterface } from '@/interfaces/define';

const InterfaceWYSIWYG = () =>
	import(/* webpackChunkName: 'interface-wysiwyg', webpackPrefetch: true */ './wysiwyg.vue');

export default defineInterface({
	id: 'wysiwyg',
	name: '$t:interfaces.wysiwyg.wysiwyg',
	description: '$t:interfaces.wysiwyg.description',
	icon: 'format_quote',
	component: InterfaceWYSIWYG as AsyncComponent,
	types: ['text'],
	options: [
		{
			field: 'toolbar',
			name: '$t:interfaces.wysiwyg.toolbar',
			type: 'json',
			schema: {
				default_value: [
					'bold',
					'italic',
					'underline',
					'removeformat',
					'customLink',
					'bullist',
					'numlist',
					'blockquote',
					'h1',
					'h2',
					'h3',
					'customImage',
					'customMedia',
					'hr',
					'code',
					'fullscreen',
				],
			},
			meta: {
				width: 'half',
				interface: 'dropdown-multiselect',
				options: {
					choices: [
						{
							value: 'aligncenter',
							text: '$t:wysiwyg_options.aligncenter',
						},
						{
							value: 'alignjustify',
							text: '$t:wysiwyg_options.alignjustify',
						},
						{
							value: 'alignleft',
							text: '$t:wysiwyg_options.alignleft',
						},
						{
							value: 'alignnone',
							text: '$t:wysiwyg_options.alignnone',
						},
						{
							value: 'alignright',
							text: '$t:wysiwyg_options.alignright',
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
							value: 'hr',
							text: '$t:wysiwyg_options.hr',
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
							value: 'customMedia',
							text: '$t:wysiwyg_options.media',
						},
						{
							value: 'customImage',
							text: '$t:wysiwyg_options.image',
						},
						{
							value: 'copy',
							text: '$t:wysiwyg_options.copy',
						},
						{
							value: 'cut',
							text: '$t:wysiwyg_options.cut',
						},
						{
							value: 'paste',
							text: '$t:wysiwyg_options.paste',
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
							value: 'fontselect',
							text: '$t:wysiwyg_options.fontselect',
						},
						{
							value: 'fontsizeselect',
							text: '$t:wysiwyg_options.fontsizeselect',
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
							value: 'undo',
							text: '$t:wysiwyg_options.undo',
						},
						{
							value: 'redo',
							text: '$t:wysiwyg_options.redo',
						},
						{
							value: 'remove',
							text: '$t:wysiwyg_options.remove',
						},
						{
							value: 'removeformat',
							text: '$t:wysiwyg_options.removeformat',
						},
						{
							value: 'selectall',
							text: '$t:wysiwyg_options.selectall',
						},
						{
							value: 'table',
							text: '$t:wysiwyg_options.table',
						},
						{
							value: 'visualaid',
							text: '$t:wysiwyg_options.visualaid',
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
				interface: 'dropdown',
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
			field: 'customFormats',
			name: '$t:interfaces.wysiwyg.custom_formats',
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
			name: '$t:interfaces.wysiwyg.options_override',
			type: 'json',
			meta: {
				interface: 'code',
				options: {
					language: 'json',
				},
			},
		},
		{
			field: 'imageToken',
			name: '$t:interfaces.markdown.imageToken',
			type: 'string',
			meta: {
				note: '$t:interfaces.markdown.imageToken_label',
				width: 'full',
				interface: 'text-input',
			},
		},
	],
});
