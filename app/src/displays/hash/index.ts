import { defineDisplay } from '@directus/extensions';
import DisplayHash from './hash.vue';

export default defineDisplay({
	id: 'hash',
	name: '$t:displays.hash.hash',
	description: '$t:displays.hash.description',
	types: ['hash'],
	icon: 'fingerprint',
	component: DisplayHash,
	options: [
		{
			field: 'masked',
			name: '$t:displays.hash.masked',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:displays.hash.masked_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
});
