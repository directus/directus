import { defineInterface } from '@/interfaces/define';
import InterfaceInput from './input.vue';

export default defineInterface({
	id: 'input',
	name: '$t:interfaces.input.text-input',
	description: '$t:interfaces.input.description',
	icon: 'text_fields',
	component: InterfaceInput,
	types: ['string', 'uuid'],
	options: [
		{
			field: 'placeholder',
			name: '$t:placeholder',
			meta: {
				width: 'half',
				interface: 'input',
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
			field: 'iconLeft',
			name: '$t:icon_left',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-icon',
			},
		},
		{
			field: 'iconRight',
			name: '$t:icon_right',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-icon',
			},
		},
		{
			field: 'trim',
			name: '$t:interfaces.input.trim',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: '$t:interfaces.input.trim_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'masked',
			name: '$t:interfaces.input.mask',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: '$t:interfaces.input.mask_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'clear',
			name: '$t:interfaces.input.clear',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: '$t:interfaces.input.clear_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
});
