import { defineDisplay } from '@/displays/define';
import DisplayDateTime from './datetime.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'datetime',
	name: i18n.t('datetime'),
	icon: 'query_builder',
	handler: DisplayDateTime,
	options: [
		{
			field: 'relative',
			name: i18n.t('relative'),
			type: 'boolean',
			meta: {
				interface: 'toggle',
				options: {
					label: 'Show relative time, eg: 5 minutes ago',
				},
			},
		},
	],
	types: ['dateTime', 'date', 'time', 'timestamp'],
}));
