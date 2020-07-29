import { defineInterface } from '../define';
import InterfaceFile from './file.vue';

export default defineInterface(({ i18n }) => ({
	id: 'file',
	name: i18n.t('file'),
	icon: 'note_add',
	component: InterfaceFile,
	types: ['uuid'],
	relationship: 'm2o',
	options: [],
}));
