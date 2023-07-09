import { defineInterface } from '@directus/utils';
import InterfaceBlockEditor from './input-block-editor.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'input-block-editor',
	name: '$t:interfaces.input-block-editor.input-block-editor',
	description: '$t:interfaces.input-block-editor.description',
	icon: 'code',
	component: InterfaceBlockEditor,
	types: ['json'],
	group: 'standard',
	preview: PreviewSVG,
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
			name: '$t:interfaces.input-block-editor.tools',
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
							text: '$t:interfaces.input-block-editor.tools_options.header',
						},
						{
							value: 'nestedlist',
							text: '$t:interfaces.input-block-editor.tools_options.nestedlist',
						},
						{
							value: 'embed',
							text: '$t:interfaces.input-block-editor.tools_options.embed',
						},
						{
							value: 'paragraph',
							text: '$t:interfaces.input-block-editor.tools_options.paragraph',
						},
						{
							value: 'code',
							text: '$t:interfaces.input-block-editor.tools_options.code',
						},
						{
							value: 'image',
							text: '$t:interfaces.input-block-editor.tools_options.image',
						},
						{
							value: 'attaches',
							text: '$t:interfaces.input-block-editor.tools_options.attaches',
						},
						{
							value: 'table',
							text: '$t:interfaces.input-block-editor.tools_options.table',
						},
						{
							value: 'quote',
							text: '$t:interfaces.input-block-editor.tools_options.quote',
						},
						{
							value: 'underline',
							text: '$t:interfaces.input-block-editor.tools_options.underline',
						},
						{
							value: 'inlinecode',
							text: '$t:interfaces.input-block-editor.tools_options.inlinecode',
						},
						{
							value: 'delimiter',
							text: '$t:interfaces.input-block-editor.tools_options.delimiter',
						},
						{
							value: 'checklist',
							text: '$t:interfaces.input-block-editor.tools_options.checklist',
						},
						{
							value: 'toggle',
							text: '$t:interfaces.input-block-editor.tools_options.toggle',
						},
						{
							value: 'alignment',
							text: '$t:interfaces.input-block-editor.tools_options.alignment',
						},
						{
							value: 'raw',
							text: '$t:interfaces.input-block-editor.tools_options.raw',
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
		},
	],
});
