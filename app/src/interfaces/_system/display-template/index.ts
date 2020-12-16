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
			field: 'collectionField',
			name: i18n.t('interfaces.display-template.collection_field'),
			type: 'string',
			meta: {
				width: 'full',
				interface: 'text-input',
			},
			schema: {
				default_value: null,
			},
		},
	],
}));
