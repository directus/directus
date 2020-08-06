import { defineDisplay } from '@/displays/define';
import DisplayFile from './file.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'file',
	name: i18n.t('file'),
	icon: 'insert_photo',
	handler: DisplayFile,
	types: ['uuid'],
	options: [],
	fields: ['data', 'type', 'title'],
}));
