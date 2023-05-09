import { defineInterface } from '@directus/utils';
import InterfaceBlockEditor from './input-block-editor.vue';

export default defineInterface({
	id: 'blockeditor',
	name: 'Block Editor',
	description: 'Block-styled editor for rich media stories, outputs clean data in JSON using Editor.js',
	icon: 'code',
	component: InterfaceBlockEditor,
	types: ['json'],
	group: 'standard',
	options: [
		{
			field: 'placeholder',
			name: '$t:placeholder',
			meta: {
				width: 'half',
				interface: 'text-input',
				options: {
					placeholder: '$t:enter_a_placeholder',
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
						{
							text: '$t:sans_serif',
							value: 'sans-serif',
						},
						{
							text: '$t:monospace',
							value: 'monospace',
						},
						{
							text: '$t:serif',
							value: 'serif',
						},
					],
				},
			},
			schema: {
				default_value: 'sans-serif',
			},
		},
		{
			field: 'tools',
			name: '$t:interfaces.input-rich-text-html.toolbar',
			type: 'json',
			schema: {
				default_value: ['header', 'nestedlist', 'code', 'image', 'paragraph', 'checklist', 'quote', 'underline'],
			},
			meta: {
				width: 'half',
				interface: 'select-multiple-dropdown',
				options: {
					choices: [
						{
							value: 'header',
							text: 'Header',
						},
						{
							value: 'nestedlist',
							text: 'List',
						},
						{
							value: 'embed',
							text: 'Embed',
						},
						{
							value: 'paragraph',
							text: 'Paragraph',
						},
						{
							value: 'code',
							text: 'Code',
						},
						{
							value: 'image',
							text: 'Image',
						},
						{
							value: 'attaches',
							text: 'Attaches',
						},
						{
							value: 'table',
							text: 'Table',
						},
						{
							value: 'quote',
							text: 'Quote',
						},
						{
							value: 'underline',
							text: 'Underline',
						},
						{
							value: 'inlinecode',
							text: 'Inline Code',
						},
						{
							value: 'delimiter',
							text: 'Delimiter',
						},
						{
							value: 'checklist',
							text: 'Checklist',
						},
						{
							value: 'toggle',
							text: 'Toggle Block',
						},
						{
							value: 'alignment',
							text: 'Alignment',
						},
						{
							value: 'raw',
							text: 'Raw HTML',
						},
					],
				},
			},
		},
		{
			field: 'bordered',
			name: '$t:displays.formatted-value.border',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:displays.formatted-value.border_label',
				},
			},
			schema: {
				default_value: true,
			},
		},
		{
			field: 'folder',
			name: '$t:interfaces.system-folder.folder',
			type: 'uuid',
			meta: {
				width: 'full',
				interface: 'system-folder',
				note: '$t:interfaces.system-folder.field_hint',
			},
			schema: {
				default_value: undefined,
			},
		},
	],
});
