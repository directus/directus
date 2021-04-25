import { defineDisplay } from '@/displays/define';
import DisplayFile from './file.vue';

export default defineDisplay({
	id: 'file',
	name: '$t:displays.file.file',
	description: '$t:displays.file.description',
	icon: 'insert_drive_file',
	handler: DisplayFile,
	types: ['uuid'],
	options: [],
	fields: ['id', 'type', 'title'],
});
