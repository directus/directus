import { defineInterface } from '@/interfaces/define';
import InterfaceDisplayTemplate from './display-template.vue';

export default defineInterface(({ i18n }) => ({
	id: 'display-template',
	name: i18n.t('display-template'),
	icon: 'arrow_drop_down_circle',
	component: InterfaceDisplayTemplate,
	types: ['string'],
	system: true,
	options: [],
}));
