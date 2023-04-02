import { defineInterface } from '@directus/extensions-sdk';
import InterfaceInlineFormM2O from './inline-form-m2o.vue';

export default defineInterface({
	id: 'inline-form-m2o',
	name: '$t:interfaces.inline-form-m2o.inline-form',
	description: '$t:interfaces.inline-form-m2o.description',
	icon: 'view_agenda',
	component: InterfaceInlineFormM2O,
	types: ['uuid', 'string', 'text', 'integer', 'bigInteger'],
	relational: true,
	localTypes: ['m2o'],
	group: 'relational',
	hideLabel: true,
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
});
