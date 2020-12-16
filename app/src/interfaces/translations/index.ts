import { defineInterface } from '../define';
import InterfaceTranslations from './translations.vue';
import TranslationsOptions from './options.vue';

export default defineInterface(({ i18n }) => ({
	id: 'translations',
	name: i18n.t('translations'),
	icon: 'replay',
	types: ['alias'],
	relational: true,
	component: InterfaceTranslations,
	options: TranslationsOptions,
}));
