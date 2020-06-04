import { defineDisplay } from '@/displays/define';
import DisplayFile from './file.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'file',
	name: i18n.t('file'),
	types: ['file'],
	icon: 'insert_photo',
	handler: DisplayFile,
	options: [],
	fields: ['data', 'type', 'title'],
}));
