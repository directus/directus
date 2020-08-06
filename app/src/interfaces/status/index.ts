import InterfaceStatus from './status.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'status',
	name: i18n.t('status'),
	icon: 'bubble_chart',
	component: InterfaceStatus,
	types: ['string'],
	options: [
		/** @TODO change this to a custom options element */
		{
			field: 'status_mapping',
			name: i18n.t('status_mapping'),
			type: 'json',
			meta: {
				width: 'full',
				interface: 'code',
				options: {
					language: 'json'
				}
			}
		},
	],
}));
