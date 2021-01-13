import { defineInterface } from '@/interfaces/define';
import InterfaceActions from './actions.vue';

export default defineInterface(({ i18n }) => ({
	id: 'actions',
	name: i18n.t('interfaces.actions.actions'),
	description: i18n.t('interfaces.actions.description'),
	icon: 'smart_button',
	component: InterfaceActions,
	hideLabel: true,
	hideLoader: true,
	types: ['alias'],
	groups: ['presentation'],
	options: [
		{
			field: 'actionsStyle',
			name: i18n.t('interfaces.actions.style'),
			type: 'string',
			meta: {
				width: 'half-left',
				interface: 'dropdown',
				default_value: 'normal',
				options: {
					choices: [
						{ text: i18n.t('interfaces.actions.button'), value: 'button' },
						{ text: i18n.t('interfaces.actions.link'), value: 'link' },
					],
				},
			},
			schema: {
				default_value: 'button',
			},
		},
		{
			field: 'actions',
			type: 'json',
			name: i18n.t('Actions'),
			meta: {
				width: 'full',
				interface: 'repeater',
				options: {
					placeholder: i18n.t('title'),
					template: '{{ label }}',
					fields: [
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
							field: 'label',
							type: 'string',
							name: i18n.t('label'),
							meta: {
								width: 'half',
								interface: 'text-input',
								options: {
									placeholder: i18n.t('label'),
								},
							},
						},
						{
							field: 'actionStyle',
							name: i18n.t('interfaces.actions.style'),
							type: 'string',
							meta: {
								width: 'half',
								interface: 'dropdown',
								default_value: 'normal',
								options: {
									choices: [
										{ text: i18n.t('interfaces.actions.primary'), value: 'primary' },
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
							name: i18n.t('URL'),
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
