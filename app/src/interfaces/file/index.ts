import { defineInterface } from '../define';
import InterfaceFile from './file.vue';

export default defineInterface(({ i18n }) => ({
	id: 'file',
	name: i18n.t('interfaces.file.file'),
	description: i18n.t('interfaces.file.description'),
	icon: 'note_add',
	component: InterfaceFile,
	types: ['uuid'],
	relationship: 'm2o',
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
	recommendedDisplays: ['file'],
}));
