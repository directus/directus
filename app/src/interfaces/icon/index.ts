import { defineInterface } from '../define';
import InterfaceIcon from './icon.vue';

export default defineInterface(({ i18n }) => ({
	id: 'icon',
	name: i18n.t('interfaces.icon.icon'),
	description: i18n.t('interfaces.icon.description'),
	icon: 'insert_emoticon',
	component: InterfaceIcon,
	types: ['string'],
	options: [],
	recommendedDisplays: ['icon'],
}));
