import { defineInterface } from '@/interfaces/define';
import InterfaceCollections from './collections.vue';

export default defineInterface(({ i18n }) => ({
	id: 'collections',
	name: i18n.t('collections'),
	icon: 'featured_play_list',
	component: InterfaceCollections,
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
					label: i18n.t('include_system_collections'),
				},
			},
			schema: {
				default_value: false,
			}
		},
	],
}));
