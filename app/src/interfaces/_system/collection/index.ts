import { defineInterface } from '@/interfaces/define';
import InterfaceCollection from './collection.vue';

export default defineInterface(({ i18n }) => ({
	id: 'collection',
	name: i18n.t('interfaces.collection.collection'),
	description: i18n.t('interfaces.collection.description'),
	icon: 'featured_play_list',
	component: InterfaceCollection,
	types: ['string'],
	options: [
		{
			field: 'includeSystem',
			name: i18n.t('system'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: i18n.t('interfaces.collection.include_system_collections'),
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
	system: true,
	recommendedDisplays: ['collection'],
}));
