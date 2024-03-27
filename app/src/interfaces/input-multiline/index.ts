import { defineInterface } from '@directus/extensions';
import InterfaceInputMultiline from './input-multiline.vue';
import Preview from './preview.svg?raw';

export default defineInterface({
	id: 'input-multiline',
	name: '$t:interfaces.input-multiline.textarea',
	description: '$t:interfaces.input-multiline.description',
	icon: 'text_fields',
	component: InterfaceInputMultiline,
	types: ['text'],
	group: 'standard',
	options: [
		{
			field: 'placeholder',
			name: '$t:placeholder',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'system-input-translated-string',
				options: {
					placeholder: '$t:enter_a_placeholder',
				},
			},
		},
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
			field: 'trim',
			name: '$t:interfaces.input.trim',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:interfaces.input.trim_label',
				},
			},
			schema: {
				default_value: false,
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
			field: 'clear',
			name: '$t:interfaces.input.clear',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:interfaces.input.clear_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
	preview: Preview,
});
