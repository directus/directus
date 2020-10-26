import { defineInterface } from '../define';
import InterfaceFile from './file.vue';

export default defineInterface(({ i18n }) => ({
	id: 'file',
	name: i18n.t('interfaces.file.file'),
	description: i18n.t('interfaces.file.description'),
	icon: 'note_add',
	component: InterfaceFile,
	types: ['uuid'],
	localTypes: ['file'],
	relationship: 'm2o',
	options: [],
	recommendedDisplays: ['file'],
}));
