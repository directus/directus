import { defineInterface } from '@/interfaces/define';
import InterfaceInterface from './interface.vue';

export default defineInterface(({ i18n }) => ({
	id: 'interface',
	name: i18n.t('interfaces.interface.interface'),
	description: i18n.t('interfaces.interface.description'),
	icon: 'box',
	component: InterfaceInterface,
	types: ['string'],
	system: true,
	options: [],
}));
