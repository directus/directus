import { defineInterface } from '@/interfaces/define';
import InterfaceDateTime from './datetime.vue';

export default defineInterface(({ i18n }) => ({
	id: 'datetime',
	name: i18n.t('datetime'),
	icon: 'today',
	component: InterfaceDateTime,
	types: ['datetime', 'date', 'time', 'timestamp'],
	options: [
		{
			field: 'includeSeconds',
			name: i18n.t('include_seconds'),
			system: {
				width: 'half',
				interface: 'toggle',
			},
			database: {
				default_value: false,
			},
		},
	],
}));
