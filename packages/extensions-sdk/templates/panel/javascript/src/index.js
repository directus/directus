import PanelComponent from './panel.vue';

export default {
	id: 'custom',
	name: 'Custom',
	icon: 'box',
	description: 'This is my custom panel!',
	component: PanelComponent,
	options: [
		{
			field: 'text',
			name: 'Text',
			type: 'string',
			meta: {
				interface: 'input',
				width: 'full',
			},
		},
	],
	minWidth: 12,
	minHeight: 8,
};
