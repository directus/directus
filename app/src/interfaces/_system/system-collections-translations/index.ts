import { defineInterface } from '@directus/extensions';
import SystemCollectionsTranslations from './system-collections-translations.vue';

export default defineInterface({
	id: 'system-collections-translations',
	name: '$t:enable_translations',
	icon: 'translate',
	component: SystemCollectionsTranslations,
	system: true,
	types: ['alias'],
	options: [],
	hideLabel: true,
});
