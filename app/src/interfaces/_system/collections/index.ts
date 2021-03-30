import { defineInterface } from '@/interfaces/define';
import InterfaceCollections from './collections.vue';

export default defineInterface({
	id: 'collections',
	name: '$t:interfaces.collections.collections',
	description: '$t:interfaces.collections.description',
	icon: 'featured_play_list',
	component: InterfaceCollections,
	types: ['json', 'csv'],
	options: [
		{
			field: 'includeSystem',
			name: '$t:system',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: '$t:interfaces.collections.include_system_collections',
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
	system: true,
	recommendedDisplays: ['labels'],
});
