import { defineInterface } from '../define';
import InterfaceFile from './file.vue';

export default defineInterface({
	id: 'file',
	name: '$t:interfaces.file.file',
	description: '$t:interfaces.file.description',
	icon: 'note_add',
	component: InterfaceFile,
	types: ['uuid'],
	groups: ['file'],
	relational: true,
	options: [],
	recommendedDisplays: ['file'],
});
