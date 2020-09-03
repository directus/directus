import { defineInterface } from '../define';
import InterfaceInterface from './interface.vue';

export default defineInterface(({ i18n }) => ({
	id: 'interface',
	name: 'Interface',
	icon: 'box',
	component: InterfaceInterface,
	types: ['string'],
	system: true,
	options: [],
}));
