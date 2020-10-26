import { defineInterface } from '@/interfaces/define';
import InterfaceCollection from './folder.vue';

export default defineInterface(({ i18n }) => ({
	id: 'folder',
	name: i18n.t('interfaces.folder.folder'),
	description: i18n.t('interfaces.folder.description'),
	icon: 'folder',
	component: InterfaceCollection,
	types: ['uuid'],
	options: [],
	system: true,
	recommendedDisplays: ['raw'],
}));
