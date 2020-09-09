import { defineDisplay } from '@/displays/define';
import DisplayDateTime from './datetime.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'datetime',
	name: i18n.t('displays.datetime.datetime'),
	description: i18n.t('displays.datetime.description'),
	icon: 'query_builder',
	handler: DisplayDateTime,
	options: [
		{
			field: 'relative',
			name: i18n.t('displays.datetime.relative'),
			type: 'boolean',
			meta: {
				interface: 'toggle',
				options: {
					label: i18n.t('displays.datetime.relative_label'),
				},
			},
			schema: {
				default_value: false,
			},
		},
	],
	types: ['dateTime', 'date', 'time', 'timestamp'],
}));
