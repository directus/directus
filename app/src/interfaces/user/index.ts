import InterfaceUser from './user.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'user',
	name: i18n.t('user'),
	icon: 'person',
	component: InterfaceUser,
	types: ['uuid'],
	options: [],
}));
