import { defineInterface } from '@/interfaces/define';
import InterfaceOptions from './interface-options.vue';

export default defineInterface(({ i18n }) => ({
	id: 'interface-options',
	name: i18n.t('interfaces.interface-options.interface-options'),
	description: i18n.t('interfaces.interface-options.description'),
	icon: 'box',
	component: InterfaceOptions,
	types: ['string'],
	options: [],
	system: true,
}));
