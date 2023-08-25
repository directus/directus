import { defineInterface } from '@directus/utils';
import InterfaceFile from './file.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'file',
	name: '$t:interfaces.file.file',
	description: '$t:interfaces.file.description',
	icon: 'note_add',
	component: InterfaceFile,
	types: ['uuid'],
	localTypes: ['file'],
	group: 'relational',
	relational: true,
	options: [
		{
			field: 'folder',
			name: '$t:interfaces.system-folder.folder',
			type: 'uuid',
			meta: {
				width: 'full',
				interface: 'system-folder',
				note: '$t:interfaces.system-folder.field_hint',
			},
		},
		{
			field: 'showNavigation',
			name: '$t:interfaces.system-folder.show_navigation',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'checkbox',
				options: {
					label: '$t:interfaces.system-folder.show_navigation_label',
				}
			},
			schema: {
				default_value: true
			}
		},
	],
	recommendedDisplays: ['file'],
	preview: PreviewSVG,
});
