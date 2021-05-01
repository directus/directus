import { defineInterface } from '@/interfaces/define';
import InterfaceTab from './tab.vue';

export default defineInterface({
	id: 'tab',
	name: '$t:interfaces.tab.tab',
	description: '$t:interfaces.tab.description',
	icon: 'tab',
	component: InterfaceTab,
	hideLabel: true,
	hideLoader: true,
	types: ['alias'],
	groups: ['presentation'],
	options: [
		{
			field: 'icon',
			name: '$t:icon',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
	],
});
