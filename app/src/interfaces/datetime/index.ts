import { defineInterface } from '@/interfaces/define';
import InterfaceDateTime from './datetime.vue';

export default defineInterface(({ i18n }) => ({
	id: 'datetime',
	name: i18n.t('datetime'),
	icon: 'today',
	component: InterfaceDateTime,
	types: ['dateTime', 'date', 'time', 'timestamp'],
	options: [
		{
			field: 'includeSeconds',
			name: i18n.t('include_seconds'),
			meta: {
				width: 'half',
				interface: 'toggle',
			},
			schema: {
				default_value: false,
			},
		},
	],
}));
