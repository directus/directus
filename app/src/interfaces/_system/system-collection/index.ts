import { defineInterface } from '@directus/extensions';
import InterfaceSystemCollection from './system-collection.vue';

export default defineInterface({
	id: 'system-collection',
	name: '$t:interfaces.system-collection.collection',
	description: '$t:interfaces.system-collection.description',
	icon: 'featured_play_list',
	component: InterfaceSystemCollection,
	types: ['string'],
	options: [
		{
			field: 'includeSystem',
			name: '$t:system',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:interfaces.system-collection.include_system_collections',
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
	system: true,
	recommendedDisplays: ['collection'],
});
