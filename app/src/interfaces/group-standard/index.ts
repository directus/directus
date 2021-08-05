import { defineInterface } from '@directus/shared/utils';
import InterfaceGroupStandard from './group-standard.vue';

export default defineInterface({
	id: 'group-standard',
	name: '$t:interfaces.group-standard.name',
	description: '$t:interfaces.group-standard.description',
	icon: 'view_in_ar',
	component: InterfaceGroupStandard,
	groups: ['group'],
	types: ['alias'],
	options: [
		{
			field: 'showHeader',
			name: '$t:interfaces.group-standard.show_header',
			type: 'boolean',
			meta: {
				interface: 'boolean',
				width: 'half',
			},
		},
		{
			field: 'headerIcon',
			name: '$t:interfaces.group-standard.header_icon',
			type: 'string',
			meta: {
				interface: 'select-icon',
				width: 'half',
				readonly: true,
				conditions: [
					{
						rule: {
							showHeader: {
								_eq: true,
							},
						},
						readonly: false,
					},
				],
			},
		},
		{
			field: 'headerColor',
			name: '$t:interfaces.group-standard.header_color',
			type: 'string',
			meta: {
				interface: 'select-color',
				width: 'half',
				readonly: true,
				conditions: [
					{
						rule: {
							showHeader: {
								_eq: true,
							},
						},
						readonly: false,
					},
				],
			},
		},
	],
});
