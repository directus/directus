import { defineInterface } from '@directus/extensions';
import InterfaceGroupTabs from './group-tabs.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'group-tabs',
	name: '$t:interfaces.group-tabs.name',
	description: '$t:interfaces.group-tabs.description',
	icon: 'tab',
	component: InterfaceGroupTabs,
	hideLabel: true,
	hideLoader: true,
	autoKey: true,
	types: ['alias'],
	localTypes: ['group'],
	group: 'group',
	options: [
		{
			field: 'fillWidth',
			type: 'boolean',
			name: '$t:interfaces.group-tabs.overwrite_group_width',
			meta: {
				interface: 'boolean',
				note: '$t:interfaces.group-tabs.fill_width_note',
				options: {
					label: '$t:interfaces.group-tabs.fill_width',
				},
				width: 'half',
			},
			schema: {
				default_value: false,
			},
		},
	],
	preview: PreviewSVG,
});
