import InterfaceHash from './hash.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'hash',
	name: i18n.t('interfaces.hash.hash'),
	description: i18n.t('interfaces.hash.description'),
	icon: 'fingerprint',
	component: InterfaceHash,
	types: ['hash'],
	options: [
		{
			field: 'placeholder',
			name: i18n.t('placeholder'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'text-input',
				options: {
					placeholder: i18n.t('enter_a_placeholder'),
				},
			},
		},
		{
			field: 'masked',
			name: i18n.t('interfaces.hash.masked'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: i18n.t('interfaces.hash.masked_label'),
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
}));
