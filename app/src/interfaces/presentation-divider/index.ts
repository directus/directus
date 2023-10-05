import { defineInterface } from '@directus/extensions';
import InterfacePresentationDivider from './presentation-divider.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'presentation-divider',
	name: '$t:interfaces.presentation-divider.divider',
	description: '$t:interfaces.presentation-divider.description',
	icon: 'remove',
	component: InterfacePresentationDivider,
	hideLabel: true,
	hideLoader: true,
	autoKey: true,
	types: ['alias'],
	localTypes: ['presentation'],
	group: 'presentation',
	options: [
		{
			field: 'title',
			name: '$t:title',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'system-input-translated-string',
				options: {
					placeholder: '$t:interfaces.presentation-divider.title_placeholder',
				},
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
			field: 'icon',
			name: '$t:icon',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-icon',
			},
		},
		{
			field: 'inlineTitle',
			name: '$t:interfaces.presentation-divider.inline_title',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:interfaces.presentation-divider.inline_title_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
	preview: PreviewSVG,
});
