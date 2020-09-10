import { defineDisplay } from '@/displays/define';
import DisplayImage from './image.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'image',
	name: i18n.t('displays.image.image'),
	description: i18n.t('displays.image.description'),
	types: ['uuid'],
	icon: 'insert_photo',
	handler: DisplayImage,
	options: [
		{
			field: 'circle',
			name: i18n.t('displays.image.circle'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: i18n.t('displays.image.circle_label'),
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
	fields: ['id', 'type', 'title'],
}));
