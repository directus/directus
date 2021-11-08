import { defineInterface } from '@directus/shared/utils';
import InterfaceSelectDropdownM2O from './select-dropdown-m2o.vue';
import PreviewSVG from './preview.svg?raw';

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
		];
	},
	recommendedDisplays: ['related-values'],
	preview: PreviewSVG,
});
