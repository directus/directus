import { defineInterface } from '../define';
import InterfaceFiles from './files.vue';

export default defineInterface(({ i18n }) => ({
	id: 'files',
	name: i18n.t('interfaces.files.files'),
	description: i18n.t('interfaces.files.description'),
	icon: 'note_add',
	component: InterfaceFiles,
	types: ['alias'],
	localTypes: ['files'],
	relationship: 'm2m',
	options: [],
	recommendedDisplays: ['files'],
}));
