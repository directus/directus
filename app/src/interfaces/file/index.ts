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
	options: [
		{
			field: 'folder',
			name: '$t:interfaces.folder.folder',
			type: 'uuid',
			meta: {
				width: 'full',
				interface: 'system-folder',
				note: '$t:interfaces.system-folder.field_hint',
				options: {
					defaultLabel: 'system',
				},
			},
			schema: {
				default_value: null,
			},
		},
	],
	recommendedDisplays: ['file'],
});
