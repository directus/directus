import InterfaceGroupDetail from './group-detail.vue';
import PreviewSVG from './preview.svg?raw';
import { defineInterface } from '@directus/extensions';

export default defineInterface({
	id: 'group-detail',
	name: '$t:interfaces.group-detail.name',
	description: '$t:interfaces.group-detail.description',
	icon: 'menu_open',
	component: InterfaceGroupDetail,
	localTypes: ['group'],
	group: 'group',
	types: ['alias'],
	options: [
		{
			field: 'start',
			name: '$t:start',
			type: 'string',
			schema: {
				default_value: 'open',
			},
			meta: {
				interface: 'select-dropdown',
				width: 'full',
				options: {
					choices: [
						{
							text: '$t:interfaces.group-detail.start_open',
							value: 'open',
						},
						{
							text: '$t:interfaces.group-detail.start_closed',
							value: 'closed',
						},
					],
				},
			},
		},
		{
			field: 'headerIcon',
			name: '$t:interfaces.group-detail.header_icon',
			type: 'string',
			meta: {
				interface: 'select-icon',
				width: 'half',
			},
		},
		{
			field: 'headerColor',
			name: '$t:interfaces.group-detail.header_color',
			type: 'string',
			meta: {
				interface: 'select-color',
				width: 'half',
			},
		},
	],
	preview: PreviewSVG,
});
