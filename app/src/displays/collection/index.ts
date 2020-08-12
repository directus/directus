import { defineDisplay } from '@/displays/define';
import DisplayCollection from './collection.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'collection',
	name: i18n.t('collection'),
	types: ['string'],
	icon: 'box',
	handler: DisplayCollection,
	options: [
		{
			field: 'icon',
			name: i18n.t('icon'),
			type: 'boolean',
			meta: {
				interface: 'toggle',
				options: {
					label: `Show the collection's icon`,
				},
			},
		},
	],
}));
