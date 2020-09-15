import { defineDisplay } from '@/displays/define';
import DisplayBoolean from './boolean.vue';

export default defineDisplay(({ i18n }) => ({
	id: 'boolean',
	name: i18n.t('displays.boolean.boolean'),
	description: i18n.t('displays.boolean.description'),
	types: ['boolean'],
	icon: 'check_box',
	handler: DisplayBoolean,
	options: [
		{
			field: 'labelOn',
			name: i18n.t('displays.boolean.label_on'),
			type: 'string',
			meta: {
				interface: 'text-input',
				width: 'half',
				options: {
					placeholder: i18n.t('displays.boolean.label_on_placeholder'),
				},
			},
		},
		{
			field: 'labelOff',
			name: i18n.t('displays.boolean.label_off'),
			type: 'string',
			meta: {
				interface: 'text-input',
				width: 'half',
				options: {
					placeholder: i18n.t('displays.boolean.label_off_placeholder'),
				},
			},
		},
		{
			field: 'iconOn',
			name: i18n.t('displays.boolean.icon_on'),
			type: 'string',
			meta: {
				interface: 'icon',
				width: 'half',
			},
			schema: {
				default_value: 'check',
			},
		},
		{
			field: 'iconOff',
			name: i18n.t('displays.boolean.icon_off'),
			type: 'string',
			meta: {
				interface: 'icon',
				width: 'half',
			},
			schema: {
				default_value: 'close',
			},
		},
		{
			field: 'colorOn',
			name: i18n.t('displays.boolean.color_on'),
			type: 'string',
			meta: {
				interface: 'color',
				width: 'half',
			},
			schema: {
				default_value: '#2F80ED',
			},
		},
		{
			field: 'colorOff',
			name: i18n.t('displays.boolean.color_off'),
			type: 'string',
			meta: {
				interface: 'color',
				width: 'half',
			},
			schema: {
				default_value: '#B0BEC5',
			},
		},
	],
}));
