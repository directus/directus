import InterfaceBoolean from './boolean.vue';
import PreviewSVG from './preview.svg?raw';
import { defineInterface } from '@directus/extensions';

export default defineInterface({
	id: 'boolean',
	name: '$t:interfaces.boolean.toggle',
	description: '$t:interfaces.boolean.description',
	icon: 'check_box',
	component: InterfaceBoolean,
	types: ['boolean'],
	group: 'selection',
	recommendedDisplays: ['boolean'],
	options: [
		{
			field: 'iconOn',
			name: '$t:icon_on',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-icon',
			},
			schema: {
				default_value: 'check_box',
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
				default_value: 'check_box_outline_blank',
			},
		},
		{
			field: 'colorOn',
			name: '$t:interfaces.boolean.color_on',
			type: 'string',
			meta: {
				interface: 'select-color',
				width: 'half',
			},
		},
		{
			field: 'colorOff',
			name: '$t:interfaces.boolean.color_off',
			type: 'string',
			meta: {
				interface: 'select-color',
				width: 'half',
			},
		},
		{
			field: 'label',
			name: '$t:label',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'system-input-translated-string',
				options: {
					placeholder: '$t:interfaces.boolean.label_placeholder',
				},
			},
			schema: {
				default_value: '$t:interfaces.boolean.label_default',
			},
		},
	],
	preview: PreviewSVG,
});
