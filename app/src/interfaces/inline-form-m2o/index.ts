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
	options: ({ relations }) => {
		const collection = relations.m2o?.related_collection;

		return [
			{
				field: 'createRelatedItem',
				type: 'string',
				name: '$t:interfaces.inline-form-m2o.create-related-item',
				schema: {
					default_value: 'withContent',
				},
				meta: {
					note: '$t:interfaces.inline-form-m2o.create-related-item-note',
					width: 'full',
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: '$t:interfaces.inline-form-m2o.only-with-content',
								value: 'withContent',
							},
							{
								text: '$t:interfaces.inline-form-m2o.always-create',
								value: 'always',
							},
						],
					},
				},
			},
		];
	},
	recommendedDisplays: ['related-values'],
});
