import { defineInterface } from '@/interfaces/define';
import InterfaceCollection from './folder.vue';

export default defineInterface({
	id: 'system-folder',
	name: '$t:interfaces.folder.folder',
	description: '$t:interfaces.folder.description',
	icon: 'folder',
	component: InterfaceCollection,
	types: ['uuid'],
	options: [],
	system: true,
	recommendedDisplays: ['raw'],
});
