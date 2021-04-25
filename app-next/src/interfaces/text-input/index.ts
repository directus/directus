import InterfaceTextInput from './text-input.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface({
	id: 'text-input',
	name: '$t:interfaces.text-input.text-input',
	description: '$t:interfaces.text-input.description',
	icon: 'text_fields',
	component: InterfaceTextInput,
	types: ['string', 'uuid'],
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
				interface: 'icon',
			},
		},
		{
			field: 'iconRight',
			name: '$t:icon_right',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
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
			field: 'masked',
			name: '$t:interfaces.text-input.mask',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: '$t:interfaces.text-input.mask_label',
				},
			},
			schema: {
				default_value: false,
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
