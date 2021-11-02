import { defineInterface } from '@directus/shared/utils';
import InterfaceBoolean from './boolean.vue';

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
			field: 'label',
			name: '$t:label',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
				options: {
					placeholder: '$t:interfaces.boolean.label_placeholder',
				},
			},
			schema: {
				default_value: '$t:interfaces.boolean.label_default',
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
			schema: {
				default_value: '#00C897',
			},
		},
	],
});
