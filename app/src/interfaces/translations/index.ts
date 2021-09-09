import { defineInterface } from '@directus/shared/utils';
import TranslationsOptions from './options.vue';
import InterfaceTranslations from './translations.vue';

export default defineInterface({
	id: 'translations',
	name: '$t:translations',
	icon: 'replay',
	types: ['alias'],
	relational: true,
	component: InterfaceTranslations,
	options: TranslationsOptions,
});
