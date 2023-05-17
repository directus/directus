import { defineInterface } from '@directus/utils';
import PreviewSVG from './preview.svg?raw';
import InterfaceSelectRadio from './select-radio.vue';

export default defineInterface({
	id: 'select-radio',
	name: '$t:interfaces.select-radio.radio-buttons',
	description: '$t:interfaces.select-radio.description',
	icon: 'radio_button_checked',
	component: InterfaceSelectRadio,
	types: ['string', 'integer', 'float', 'bigInteger'],
	recommendedDisplays: ['badge'],
	group: 'selection',
	preview: PreviewSVG,
	options: ({ field }) => [
		{
			field: 'choices',
			type: 'json',
			name: '$t:choices',
			meta: {
				width: 'full',
				interface: 'list',
				options: {
					template: '{{ text }}',
					fields: [
						{
							field: 'text',
							type: 'string',
							name: '$t:text',
							meta: {
								width: 'half',
								required: true,
								interface: 'system-input-translated-string',
							},
						},
						{
							field: 'value',
							type: field.type,
							name: '$t:value',
							meta: {
								width: 'half',
								interface: 'input',
								required: true,
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
			name: '$t:interfaces.select-dropdown.allow_other',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:interfaces.select-dropdown.allow_other_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
});
