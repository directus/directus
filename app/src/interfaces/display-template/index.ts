import { defineInterface } from '@/interfaces/define';
import InterfaceDisplayTemplate from './display-template.vue';

export default defineInterface(({ i18n }) => ({
	id: 'display-template',
	name: i18n.t('interfaces.display-template.display-template'),
	description: i18n.t('interfaces.display-template.description'),
	icon: 'arrow_drop_down_circle',
	component: InterfaceDisplayTemplate,
	types: ['string'],
	system: true,
	options: [
		{
			field: 'collection',
			name: i18n.t('collection'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'collections',
				options: {
					includeSystem: true,
				},
			},
			schema: {
				default_value: null,
			},
		},
	],
}));
