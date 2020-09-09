import { defineDisplay } from '@/displays/define';
import DisplayCollection from './collection.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'collection',
	name: i18n.t('displays.collection.collection'),
	description: i18n.t('displays.collection.description'),
	types: ['string'],
	icon: 'label',
	handler: DisplayCollection,
	options: [
		{
			field: 'icon',
			name: i18n.t('icon'),
			type: 'boolean',
			meta: {
				interface: 'toggle',
				options: {
					label: i18n.t('displays.collection.icon_label'),
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
}));
