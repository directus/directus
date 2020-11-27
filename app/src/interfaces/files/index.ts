import { defineInterface } from '../define';
import InterfaceFiles from './files.vue';
import FilesOptions from './options.vue';

export default defineInterface(({ i18n }) => ({
	id: 'files',
	name: i18n.t('interfaces.files.files'),
	description: i18n.t('interfaces.files.description'),
	icon: 'note_add',
	component: InterfaceFiles,
	types: ['alias'],
	groups: ['files'],
	relational: true,
	options: FilesOptions,
	recommendedDisplays: ['files'],
}));
