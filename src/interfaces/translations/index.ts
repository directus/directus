import { defineInterface } from '../define';
import InterfaceTranslations from './translations.vue';

export default defineInterface(({ i18n }) => ({
	id: 'translations',
	name: i18n.t('translations'),
	icon: 'replay',
	types: ['o2m'],
	component: InterfaceTranslations,
	options: [],
}));
