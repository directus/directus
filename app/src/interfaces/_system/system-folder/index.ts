import InterfaceSystemFolder from './folder.vue';
import { defineInterface } from '@directus/extensions';

export default defineInterface({
	id: 'system-folder',
	name: '$t:interfaces.system-folder.folder',
	description: '$t:interfaces.system-folder.description',
	icon: 'folder',
	component: InterfaceSystemFolder,
	types: ['uuid'],
	options: [],
	system: true,
	recommendedDisplays: ['raw'],
});
