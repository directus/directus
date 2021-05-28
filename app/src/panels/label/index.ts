import { definePanel } from '../define';
import PanelLabel from './label.vue';

export default definePanel({
	id: 'label',
	name: '$t:panels.label.name',
	description: '$t:panels.label.description',
	icon: 'functions',
	component: PanelLabel,
	options: [
		{
			field: 'text',
			name: '$t:label',
			type: 'string',
			meta: {
				interface: 'input',
				width: 'half',
			},
		},
		{
			field: 'color',
			name: '$t:color',
			type: 'string',
			meta: {
				interface: 'select-color',
				width: 'half',
			},
		},
	],
	minWidth: 10,
	minHeight: 6,
});
