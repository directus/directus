import { defineInterface } from '@directus/utils';
import InterfaceSystemDisplayTemplate from './system-display-template.vue';

export default defineInterface({
	id: 'system-display-template',
	name: '$t:interfaces.system-display-template.display-template',
	description: '$t:interfaces.system-display-template.description',
	icon: 'arrow_drop_down_circle',
	component: InterfaceSystemDisplayTemplate,
	types: ['string'],
	system: true,
	options: [
		{
			field: 'collectionField',
			name: '$t:interfaces.system-display-template.collection_field',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input',
			},
		},
	],
});
