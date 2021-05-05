import { defineInterface } from '@/interfaces/define';
import InterfaceSelectRadio from './select-radio.vue';

export default defineInterface({
	id: 'select-radio',
	name: '$t:interfaces.select-radio.radio-buttons',
	description: '$t:interfaces.select-radio.description',
	icon: 'radio_button_checked',
	component: InterfaceSelectRadio,
	types: ['string'],
	recommendedDisplays: ['badge'],
	options: [
		{
			field: 'choices',
			type: 'json',
			name: '$t:choices',
			meta: {
				width: 'full',
				interface: 'repeater',
				options: {
					template: '{{ text }}',
					fields: [
						{
							field: 'text',
							type: 'string',
							name: '$t:text',
							meta: {
								width: 'half',
								interface: 'text-input',
							},
						},
						{
							field: 'value',
							type: 'string',
							name: '$t:value',
							meta: {
								width: 'half',
								interface: 'text-input',
								options: {
									font: 'monospace',
								},
							},
						},
					],
				},
			},
		},
		{
			field: 'iconOn',
			name: '$t:icon_on',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-icon',
			},
			schema: {
				default_value: 'radio_button_checked',
			},
		},
		{
			field: 'iconOff',
			name: '$t:icon_off',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-icon',
			},
			schema: {
				default_value: 'radio_button_unchecked',
			},
		},
		{
			field: 'color',
			name: '$t:color',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-color',
			},
		},
		{
			field: 'allowOther',
			name: '$t:interfaces.dropdown.allow_other',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: '$t:interfaces.dropdown.allow_other_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
});
