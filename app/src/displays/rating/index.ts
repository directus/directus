import { defineDisplay } from '@directus/extensions';
import DisplayRating from './rating.vue';

export default defineDisplay({
	id: 'rating',
	name: '$t:displays.rating.rating',
	description: '$t:displays.rating.description',
	icon: 'star',
	component: DisplayRating,
	options: [
		{
			field: 'simple',
			name: '$t:displays.rating.simple',
			type: 'boolean',
			meta: {
				interface: 'boolean',
				width: 'half',
				options: {
					label: '$t:displays.rating.simple_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
	types: ['integer', 'decimal', 'float'],
});
