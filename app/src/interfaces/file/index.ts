import { defineInterface } from '@directus/shared/utils';
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
			name: '$t:interfaces.system-folder.folder',
			type: 'uuid',
			meta: {
				width: 'half',
				interface: 'system-folder',
				note: '$t:interfaces.system-folder.field_hint',
			},
			schema: {
				default_value: undefined,
			},
		},
		{
			field: 'type',
			name: '$t:interfaces.system-folder.type',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				note: '$t:interfaces.system-folder.type_hint',
				options: {
					allowNone: true,
					choices: [
						{
							text: '$t:interfaces.system-folder.type_image',
							value: 'image',
						},
						{
							text: '$t:interfaces.system-folder.type_video',
							value: 'video',
						},
						{
							text: '$t:interfaces.system-folder.type_audio',
							value: 'audio',
						},
					],
				},
			},
			schema: {
				default_value: undefined,
			},
		},
	],
	recommendedDisplays: ['file'],
});
