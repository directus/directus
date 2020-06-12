import { defineInterface } from '../define';
import InterfaceIcon from './icon.vue';

export default defineInterface(({ i18n }) => ({
	id: 'icon',
	name: i18n.t('icon'),
	icon: 'insert_emoticon',
	component: InterfaceIcon,
	types: ['string'],
	options: [],
}));
