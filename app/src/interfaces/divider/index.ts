import { defineInterface } from '@/interfaces/define';
import InterfaceDivider from './divider.vue';

export default defineInterface({
	id: 'divider',
	name: '$t:interfaces.divider.divider',
	description: '$t:interfaces.divider.description',
	icon: 'remove',
	component: InterfaceDivider,
	hideLabel: true,
	hideLoader: true,
	types: ['alias'],
	groups: ['presentation'],
	options: [
		{
			field: 'color',
			name: '$t:color',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'color',
			},
		},
		{
			field: 'icon',
			name: '$t:icon',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
		},
		{
			field: 'title',
			name: '$t:title',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'text-input',
				options: {
					placeholder: '$t:interfaces.divider.title_placeholder',
				},
			},
		},
		{
			field: 'marginTop',
			name: '$t:interfaces.divider.margin_top',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: '$t:interfaces.divider.margin_top_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'inlineTitle',
			name: '$t:interfaces.divider.inline_title',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: '$t:interfaces.divider.inline_title_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
});
