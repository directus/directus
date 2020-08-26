import { defineInterface } from '../define';
import InterfaceOptions from './interface-options.vue';

export default defineInterface(({ i18n }) => ({
	id: 'interface-options',
	name: 'Interface Options',
	icon: 'box',
	component: InterfaceOptions,
	types: ['string'],
	options: [],
}));
