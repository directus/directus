import { defineInterface } from '@/interfaces/define';
import InterfaceImage from './image.vue';

export default defineInterface(({ i18n }) => ({
	id: 'image',
	name: i18n.t('interfaces.image.image'),
	description: i18n.t('interfaces.image.description'),
	icon: 'insert_photo',
	component: InterfaceImage,
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
	recommendedDisplays: ['image'],
}));
