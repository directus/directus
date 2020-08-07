import { defineDisplay } from '@/displays/define';
import DisplayImage from './image.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'image',
	name: i18n.t('image'),
	types: ['uuid'],
	icon: 'insert_photo',
	handler: DisplayImage,
	options: [
		{
			field: 'circle',
			name: i18n.t('circle'),
			type: 'boolean',
			system: {
				width: 'half',
				interface: 'toggle',
				default_value: false,
			}
		},
	],
	fields: ['id', 'type', 'title'],
}));
