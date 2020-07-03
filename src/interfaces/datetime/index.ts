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
			width: 'half',
			interface: 'toggle',
			default_value: false,
		},
	],
}));
