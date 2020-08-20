import { defineInterface } from '@/interfaces/define';
import VFieldTemplate from '@/components/v-field-template';

export default defineInterface(({ i18n }) => ({
	id: 'display-template',
	name: i18n.t('display-template'),
	icon: 'arrow_drop_down_circle',
	component: VFieldTemplate,
	types: ['string'],
	options: [
		{
			field: 'collection',
			name: i18n.t('collection'),
			type: 'string',
			meta: {
				width: 'full',
				interface: 'text-input',
				default_value: '',
			},
		},
	],
}));
