import { defineInterface } from '@directus/shared/utils';
import InterfaceListO2M from './list-o2m.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'list-o2m',
	name: '$t:interfaces.list-o2m.one-to-many',
	description: '$t:interfaces.list-o2m.description',
	icon: 'arrow_right_alt',
	component: InterfaceListO2M,
	types: ['alias'],
	localTypes: ['o2m'],
	group: 'relational',
	relational: true,
	options: ({ relations }) => {
		const collection = relations.o2m?.collection;

		return [
			{
				field: 'template',
				name: '$t:display_template',
				meta: {
					interface: 'system-display-template',
					options: {
						collectionName: collection,
					},
					width: 'full',
				},
			},
			{
				field: 'enableCreate',
				name: '$t:creating_items',
				schema: {
					default_value: true,
				},
				meta: {
					interface: 'boolean',
					options: {
						label: '$t:enable_create_button',
					},
					width: 'half',
				},
			},
			{
				field: 'enableSelect',
				name: '$t:selecting_items',
				schema: {
					default_value: true,
				},
				meta: {
					interface: 'boolean',
					options: {
						label: '$t:enable_select_button',
					},
					width: 'half',
				},
			},
		];
	},
	recommendedDisplays: ['related-values'],
	preview: PreviewSVG,
});
