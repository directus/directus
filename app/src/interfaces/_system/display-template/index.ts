import { defineInterface } from '@/interfaces/define';
import InterfaceDisplayTemplate from './display-template.vue';

export default defineInterface({
	id: 'display-template',
	name: '$t:interfaces.display-template.display-template',
	description: '$t:interfaces.display-template.description',
	icon: 'arrow_drop_down_circle',
	component: InterfaceDisplayTemplate,
	types: ['string'],
	system: true,
	options: [
		{
			field: 'collectionField',
			name: '$t:interfaces.display-template.collection_field',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'text-input',
			},
			schema: {
				default_value: null,
			},
		},
	],
});
