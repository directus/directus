import { defineInterface } from '@/interfaces/define';
import InterfaceDateTime from './datetime.vue';

export default defineInterface(({ i18n }) => ({
	id: 'datetime',
	name: i18n.t('interfaces.datetime.datetime'),
	description: i18n.t('interfaces.datetime.description'),
	icon: 'today',
	component: InterfaceDateTime,
	types: ['dateTime', 'date', 'time', 'timestamp'],
	options: [
		{
			field: 'includeSeconds',
			name: i18n.t('interfaces.datetime.include_seconds'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'use24',
			name: i18n.t('interfaces.datetime.use_24'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
			},
			schema: {
				default_value: true,
			},
		},
	],
	recommendedDisplays: ['datetime'],
}));
