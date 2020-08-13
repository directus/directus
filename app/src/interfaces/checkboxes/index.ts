import { defineInterface } from '@/interfaces/define';
import InterfaceCheckboxes from './checkboxes.vue';

export default defineInterface(({ i18n }) => ({
	id: 'checkboxes',
	name: i18n.t('checkboxes'),
	icon: 'check_box',
	component: InterfaceCheckboxes,
	types: ['json'],
	options: [
		{
			field: 'choices',
			type: 'json',
			name: i18n.t('choices'),
			meta: {
				width: 'full',
				interface: 'repeater',
				options: {
					template: '{{ text }}',
					fields: [
						{
							field: 'text',
							type: 'string',
							name: i18n.t('text'),
							meta: {
								interface: 'text-input',
							},
						},
						{
							field: 'value',
							type: 'string',
							name: i18n.t('value'),
							meta: {
								interface: 'text-input',
								options: {
									font: 'monospace',
								},
							},
						},
					],
				},
			},
		},
		{
			field: 'allowOther',
			name: i18n.t('allow_other'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
				options: {
					label: i18n.t('enables_custom_value'),
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'color',
			name: i18n.t('color'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'color',
			},
			schema: {
				default_value: '#2f80ed',
			},
		},
		{
			field: 'iconOn',
			name: i18n.t('icon_on'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
			schema: {
				default_value: 'check_box',
			},
		},
		{
			field: 'iconOff',
			name: i18n.t('icon_off'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'icon',
			},
			schema: {
				default_value: 'check_box_outline_blank',
			},
		},
	],
}));
