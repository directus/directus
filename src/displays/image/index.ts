import { defineDisplay } from '@/displays/define';
import DisplayImage from './image.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'image',
	name: i18n.t('image'),
	types: ['file'],
	icon: 'insert_photo',
	handler: DisplayImage,
	options: null,
	fields: ['data', 'type', 'title'],
}));
