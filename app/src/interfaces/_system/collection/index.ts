import { defineInterface } from '@/interfaces/define';
import InterfaceCollection from './collection.vue';

export default defineInterface({
	id: 'collection',
	name: '$t:interfaces.collection.collection',
	description: '$t:interfaces.collection.description',
	icon: 'featured_play_list',
	component: InterfaceCollection,
	types: ['string'],
	options: [
		{
			field: 'includeSystem',
			name: '$t:system',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: '$t:interfaces.collection.include_system_collections',
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
