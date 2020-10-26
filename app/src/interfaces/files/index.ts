import { defineInterface } from '../define';
import InterfaceFiles from './files.vue';

export default defineInterface(({ i18n }) => ({
	id: 'files',
	name: i18n.t('interfaces.files.files'),
	description: i18n.t('interfaces.files.description'),
	icon: 'note_add',
	component: InterfaceFiles,
	types: ['alias'],
	relationship: 'm2m',
	options: [
		{
			field: 'folder',
			name: i18n.t('interfaces.folder.folder'),
			type: 'uuid',
			meta: {
				width: 'full',
				interface: 'folder',
				note: i18n.t('interfaces.folder.field_hint'),
			},
			schema: {
				default_value: null,
			},
		},
	],
	recommendedDisplays: ['files'],
}));
