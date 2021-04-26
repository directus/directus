import InterfaceToggle from './toggle.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface({
	id: 'toggle',
	name: '$t:interfaces.toggle.toggle',
	description: '$t:interfaces.toggle.description',
	icon: 'check_box',
	component: InterfaceToggle,
	types: ['boolean'],
	recommendedDisplays: ['boolean'],
	options: [
		{
			field: 'iconOn',
			name: '$t:icon_on',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
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
				interface: 'icon',
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
				interface: 'text-input',
				options: {
					placeholder: '$t:interfaces.toggle.label_placeholder',
				},
			},
			schema: {
				default_value: '$t:interfaces.toggle.label_default',
			},
		},
		{
			field: 'color',
			name: '$t:color',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'color',
			},
			schema: {
				default_value: '#00C897',
			},
		},
	],
});
