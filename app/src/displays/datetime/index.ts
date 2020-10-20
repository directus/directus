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
			field: 'format',
			name: i18n.t('displays.datetime.format'),
			type: 'string',
			meta: {
				interface: 'dropdown',
				width: 'half',
				options: {
					choices: [
						{ text: i18n.t('displays.datetime.long'), value: 'long' },
						{ text: i18n.t('displays.datetime.short'), value: 'short' },
					],
					allowOther: true,
				},
				note: i18n.t('displays.datetime.format_note'),
			},
			schema: {
				default_value: 'long',
			},
		},
		{
			field: 'relative',
			name: i18n.t('displays.datetime.relative'),
			type: 'boolean',
			meta: {
				width: 'half',
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
