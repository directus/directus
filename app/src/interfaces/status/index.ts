import InterfaceStatus from './status.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface(({ i18n }) => ({
	id: 'status',
	name: i18n.t('status'),
	icon: 'bubble_chart',
	component: InterfaceStatus,
	types: ['string'],
	options: [
		{
			field: 'status_mapping',
			name: i18n.t('status_mapping'),
			width: 'full',
			interface: 'code',
		},
	],
}));
