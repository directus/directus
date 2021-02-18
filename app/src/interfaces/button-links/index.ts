import { defineInterface } from '@/interfaces/define';
import InterfaceButtonLinks from './button-links.vue';

export default defineInterface(({ i18n }) => ({
	id: 'button-links',
	name: i18n.t('interfaces.button-links.button-links'),
	description: i18n.t('interfaces.button-links.description'),
	icon: 'smart_button',
	component: InterfaceButtonLinks,
	hideLabel: true,
	hideLoader: true,
	types: ['alias'],
	groups: ['presentation'],
	options: [
		{
			field: 'links',
			type: 'json',
			name: i18n.t('interfaces.button-links.links'),
			meta: {
				width: 'full',
				interface: 'repeater',
				options: {
					placeholder: i18n.t('title'),
					template: '{{ label }}',
					fields: [
						{
							field: 'label',
							type: 'string',
							name: i18n.t('label'),
							meta: {
								width: 'full',
								interface: 'text-input',
								options: {
									placeholder: i18n.t('label'),
								},
							},
						},
						{
							field: 'icon',
							name: i18n.t('icon'),
							type: 'string',
							meta: {
								width: 'half',
								interface: 'icon',
							},
						},
						{
							field: 'type',
							name: i18n.t('type'),
							type: 'string',
							meta: {
								width: 'half',
								interface: 'dropdown',
								default_value: 'normal',
								options: {
									choices: [
										{ text: i18n.t('primary'), value: 'primary' },
										{ text: i18n.t('normal'), value: 'normal' },
										{ text: i18n.t('info'), value: 'info' },
										{ text: i18n.t('success'), value: 'success' },
										{ text: i18n.t('warning'), value: 'warning' },
										{ text: i18n.t('danger'), value: 'danger' },
									],
								},
							},
							schema: {
								default_value: 'normal',
							},
						},
						{
							field: 'url',
							type: 'string',
							name: i18n.t('url'),
							meta: {
								width: 'full',
								interface: 'text-input',
								options: {
									font: 'monospace',
									placeholder: 'https://example.com/articles/{{ id }}/{{ slug }}',
								},
							},
						},
					],
				},
			},
		},
	],
}));
