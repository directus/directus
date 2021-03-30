import { defineDisplay } from '@/displays/define';
import DisplayImage from './image.vue';

export default defineDisplay({
	id: 'image',
	name: '$t:displays.image.image',
	description: '$t:displays.image.description',
	types: ['uuid'],
	icon: 'insert_photo',
	handler: DisplayImage,
	options: [
		{
			field: 'circle',
			name: '$t:displays.image.circle',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: '$t:displays.image.circle_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
	fields: ['id', 'type', 'title'],
});
