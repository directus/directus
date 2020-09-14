import InterfaceWYSIWYG from './wysiwyg.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'wysiwyg',
	name: i18n.t('interfaces.wysiwyg.wysiwyg'),
	description: i18n.t('interfaces.wysiwyg.description'),
	icon: 'format_quote',
	component: InterfaceWYSIWYG,
	types: ['text'],
	options: [
		{
			field: 'toolbar',
			name: i18n.t('interfaces.wysiwyg.toolbar'),
			type: 'json',
			schema: {
				default_value: [
					'bold',
					'italic',
					'underline',
					'removeformat',
					'link',
					'bullist',
					'numlist',
					'blockquote',
					'h1',
					'h2',
					'h3',
					'image',
					'media',
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
							text: i18n.t('wysiwyg_options.aligncenter'),
						},
						{
							value: 'alignjustify',
							text: i18n.t('wysiwyg_options.alignjustify'),
						},
						{
							value: 'alignleft',
							text: i18n.t('wysiwyg_options.alignleft'),
						},
						{
							value: 'alignnone',
							text: i18n.t('wysiwyg_options.alignnone'),
						},
						{
							value: 'alignright',
							text: i18n.t('wysiwyg_options.alignright'),
						},
						{
							value: 'forecolor',
							text: i18n.t('wysiwyg_options.forecolor'),
						},
						{
							value: 'backcolor',
							text: i18n.t('wysiwyg_options.backcolor'),
						},
						{
							value: 'bold',
							text: i18n.t('wysiwyg_options.bold'),
						},
						{
							value: 'italic',
							text: i18n.t('wysiwyg_options.italic'),
						},
						{
							value: 'underline',
							text: i18n.t('wysiwyg_options.underline'),
						},
						{
							value: 'strikethrough',
							text: i18n.t('wysiwyg_options.strikethrough'),
						},
						{
							value: 'subscript',
							text: i18n.t('wysiwyg_options.subscript'),
						},
						{
							value: 'superscript',
							text: i18n.t('wysiwyg_options.superscript'),
						},
						{
							value: 'blockquote',
							text: i18n.t('wysiwyg_options.blockquote'),
						},
						{
							value: 'bullist',
							text: i18n.t('wysiwyg_options.bullist'),
						},
						{
							value: 'numlist',
							text: i18n.t('wysiwyg_options.numlist'),
						},
						{
							value: 'hr',
							text: i18n.t('wysiwyg_options.hr'),
						},
						{
							value: 'link',
							text: i18n.t('wysiwyg_options.link'),
						},
						{
							value: 'unlink',
							text: i18n.t('wysiwyg_options.unlink'),
						},
						{
							value: 'media',
							text: i18n.t('wysiwyg_options.media'),
						},
						{
							value: 'image',
							text: i18n.t('wysiwyg_options.image'),
						},
						{
							value: 'copy',
							text: i18n.t('wysiwyg_options.copy'),
						},
						{
							value: 'cut',
							text: i18n.t('wysiwyg_options.cut'),
						},
						{
							value: 'paste',
							text: i18n.t('wysiwyg_options.paste'),
						},
						{
							value: 'h1',
							text: i18n.t('wysiwyg_options.h1'),
						},
						{
							value: 'h2',
							text: i18n.t('wysiwyg_options.h2'),
						},
						{
							value: 'h3',
							text: i18n.t('wysiwyg_options.h3'),
						},
						{
							value: 'h4',
							text: i18n.t('wysiwyg_options.h4'),
						},
						{
							value: 'h5',
							text: i18n.t('wysiwyg_options.h5'),
						},
						{
							value: 'h6',
							text: i18n.t('wysiwyg_options.h6'),
						},
						{
							value: 'fontselect',
							text: i18n.t('wysiwyg_options.fontselect'),
						},
						{
							value: 'fontsizeselect',
							text: i18n.t('wysiwyg_options.fontsizeselect'),
						},
						{
							value: 'indent',
							text: i18n.t('wysiwyg_options.indent'),
						},
						{
							value: 'outdent',
							text: i18n.t('wysiwyg_options.outdent'),
						},
						{
							value: 'undo',
							text: i18n.t('wysiwyg_options.undo'),
						},
						{
							value: 'redo',
							text: i18n.t('wysiwyg_options.redo'),
						},
						{
							value: 'remove',
							text: i18n.t('wysiwyg_options.remove'),
						},
						{
							value: 'removeformat',
							text: i18n.t('wysiwyg_options.removeformat'),
						},
						{
							value: 'selectall',
							text: i18n.t('wysiwyg_options.selectall'),
						},
						{
							value: 'table',
							text: i18n.t('wysiwyg_options.table'),
						},
						{
							value: 'visualaid',
							text: i18n.t('wysiwyg_options.visualaid'),
						},
						{
							value: 'code',
							text: i18n.t('wysiwyg_options.code'),
						},
						{
							value: 'fullscreen',
							text: i18n.t('wysiwyg_options.fullscreen'),
						},
						{
							value: 'ltr rtl',
							text: i18n.t('wysiwyg_options.directionality'),
						},
					],
				},
			},
		},
		{
			field: 'font',
			name: i18n.t('font'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'dropdown',
				options: {
					choices: [
						{ text: i18n.t('sans_serif'), value: 'sans-serif' },
						{ text: i18n.t('monospace'), value: 'monospace' },
						{ text: i18n.t('serif'), value: 'serif' },
					],
				},
			},
			schema: {
				default_value: 'sans-serif',
			},
		},
		{
			field: 'customFormats',
			name: i18n.t('interfaces.wysiwyg.custom_formats'),
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
			name: i18n.t('interfaces.wysiwyg.options_override'),
			type: 'json',
			meta: {
				interface: 'code',
				options: {
					language: 'json',
				},
			},
		},
	],
}));
