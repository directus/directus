import PanelLabel from './label.vue';
import { definePanel } from '@directus/shared/utils';

export default definePanel({
	id: 'label',
	name: '$t:panels.label.name',
	description: '$t:panels.label.description',
	icon: 'title',
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
				options: {
					placeholder: '$t:automatic',
				},
			},
		},
	],
	minWidth: 12,
	minHeight: 8,
});
