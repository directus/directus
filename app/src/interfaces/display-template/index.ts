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
			field: 'value',
			name: i18n.t('value'),
			type: 'string',
			meta: {
				width: 'full',
				interface: 'text-input',
				default_value: '',
			},
		},
		{
			field: 'disabled',
			type: 'boolean',
			name: i18n.t('disabled'),
			meta: {
				width: 'half',
				interface: 'toggle',
				default_value: false,
			},
		},
		{
			field: 'collection',
			name: i18n.t('collection'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'text-input',
				default_value: '',
			},
		},
	],
}));
