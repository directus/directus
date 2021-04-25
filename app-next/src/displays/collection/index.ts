import { defineDisplay } from '@/displays/define';
import DisplayCollection from './collection.vue';

export default defineDisplay({
	id: 'collection',
	name: '$t:displays.collection.collection',
	description: '$t:displays.collection.description',
	types: ['string'],
	icon: 'label',
	handler: DisplayCollection,
	options: [
		{
			field: 'icon',
			name: '$t:icon',
			type: 'boolean',
			meta: {
				interface: 'toggle',
				options: {
					label: '$t:displays.collection.icon_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
});
