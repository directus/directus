import InterfaceTextarea from './textarea.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface({
	id: 'textarea',
	name: '$t:interfaces.textarea.textarea',
	description: '$t:interfaces.textarea.description',
	icon: 'text_fields',
	component: InterfaceTextarea,
	types: ['text'],
	options: [
		{
			field: 'placeholder',
			name: '$t:placeholder',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'text-input',
				options: {
					placeholder: '$t:enter_a_placeholder',
				},
			},
		},
		{
			field: 'trim',
			name: '$t:interfaces.text-input.trim',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: '$t:interfaces.text-input.trim_label',
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
			field: 'clear',
			name: '$t:interfaces.text-input.clear',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: '$t:interfaces.text-input.clear_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
});
