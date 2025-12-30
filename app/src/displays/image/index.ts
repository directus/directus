import DisplayImage from './image.vue';
import { defineDisplay } from '@directus/extensions';

export default defineDisplay({
	id: 'image',
	name: '$t:displays.image.image',
	description: '$t:displays.image.description',
	types: ['uuid'],
	localTypes: ['file'],
	icon: 'insert_photo',
	component: DisplayImage,
	options: [
		{
			field: 'circle',
			name: '$t:displays.image.circle',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:displays.image.circle_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
	fields: ['id', 'type', 'title', 'modified_on'],
});
