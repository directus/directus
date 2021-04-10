import { defineInterface } from '../define';
import InterfaceFiles from './files.vue';

export default defineInterface({
	id: 'files',
	name: '$t:interfaces.files.files',
	description: '$t:interfaces.files.description',
	icon: 'note_add',
	component: InterfaceFiles,
	types: ['alias'],
	groups: ['files'],
	relational: true,
	options: [],
	recommendedDisplays: ['files'],
});
