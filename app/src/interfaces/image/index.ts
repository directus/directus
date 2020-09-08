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
	options: [],
	recommendedDisplays: ['image'],
}));
