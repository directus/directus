import { defineInterface } from '@directus/utils';
import PreviewSVG from './preview.svg?raw';
import InterfaceSelectDropdownM2O from './select-dropdown-m2o.vue';

export default defineInterface({
	id: 'select-dropdown-m2o',
	name: '$t:interfaces.select-dropdown-m2o.many-to-one',
	description: '$t:interfaces.select-dropdown-m2o.description',
	icon: 'arrow_right_alt',
	component: InterfaceSelectDropdownM2O,
	types: ['uuid', 'string', 'text', 'integer', 'bigInteger'],
	relational: true,
	localTypes: ['m2o'],
	group: 'relational',
	options: ({ relations }) => {
		const collection = relations.m2o?.related_collection;

		return [
			{
				field: 'template',
				name: '$t:interfaces.select-dropdown-m2o.display_template',
				meta: {
					interface: 'system-display-template',
					options: {
						collectionName: collection,
					},
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
			{
				field: 'filter',
				name: '$t:filter',
				type: 'json',
				meta: {
					interface: 'system-filter',
					options: {
						collectionName: collection,
					},
				},
			},
		];
	},
	recommendedDisplays: ['related-values'],
	preview: PreviewSVG,
});
