import { defineInterface } from '@directus/extensions';
import InterfaceSuperHeader from './super-header.vue';

export default defineInterface({
	id: 'super-header',
	name: '$t:interfaces.super-header.super-header',
	description: '$t:interfaces.super-header.description',
	icon: 'exercise',
	component: InterfaceSuperHeader,
	types: ['alias'],
	localTypes: ['presentation'],
	group: 'presentation',
	autoKey: true,
	hideLabel: true,
	options: ({ collection }) => [
		{
			field: 'title',
			name: '$t:interfaces.super-header.title.title',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'system-display-template',
				note: '$t:interfaces.super-header.title.note',
				options: {
					collectionName: collection,
				},
			},
		},
		{
			field: 'color',
			name: '$t:interfaces.super-header.color.name',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-color',
				note: '$t:interfaces.super-header.color.note',
			},
		},
		{
			field: 'icon',
			name: '$t:interfaces.super-header.icon.name',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-icon',
				note: '$t:interfaces.super-header.icon.note',
			},
		},
		{
			field: 'subtitle',
			name: '$t:interfaces.super-header.subtitle.name',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'system-display-template',
				note: '$t:interfaces.super-header.subtitle.note',
				options: {
					collectionName: collection,
				},
			},
		},
		{
			field: 'help',
			name: '$t:interfaces.super-header.help.name',
			type: 'text',
			meta: {
				width: 'full',
				interface: 'input-rich-text-html',
				note: '$t:interfaces.super-header.help.note',
			},
		},
		{
			field: 'helpDisplayMode',
			name: '$t:interfaces.super-header.help_display_mode.name',
			type: 'string',
			schema: {
				default_value: 'inline',
			},
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				note: '$t:interfaces.super-header.help_display_mode.note',
				options: {
					choices: [
						{ text: '$t:interfaces.super-header.help_display_mode.inline', value: 'inline' },
						{ text: '$t:interfaces.super-header.help_display_mode.modal', value: 'modal' },
					],
				},
			},
		},
		{
			field: 'enableHelpTranslations',
			name: '$t:interfaces.super-header.enable_help_translations.name',
			type: 'boolean',
			meta: {
				width: 'half',
				note: '$t:interfaces.super-header.enable_help_translations.note',
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'helpTranslationsString',
			name: '$t:interfaces.super-header.help_translations_string.name',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'system-input-translated-string',
				note: '$t:interfaces.super-header.help_translations_string.note',
				hidden: true,
				conditions: [
					{
						rule: {
							enableHelpTranslations: {
								_eq: true,
							},
						},
						hidden: false,
					},
				],
			},
		},
		{
			field: 'actions',
			name: '$t:interfaces.super-header.actions.name',
			type: 'json',
			meta: {
				interface: 'list',
				note: '$t:interfaces.super-header.actions.note',
				options: {
					fields: [
						{
							field: 'label',
							type: 'string',
							name: '$t:interfaces.super-header.actions.label.name',
							meta: {
								width: 'full',
								interface: 'system-input-translated-string',
								note: '$t:interfaces.super-header.actions.label.note',
								options: {
									placeholder: 'label',
								},
							},
						},
						{
							field: 'icon',
							name: '$t:interfaces.super-header.actions.icon.name',
							type: 'string',
							meta: {
								width: 'half',
								note: '$t:interfaces.super-header.actions.icon.note',
								interface: 'select-icon',
							},
						},
						{
							field: 'type',
							name: '$t:interfaces.super-header.actions.type.name',
							type: 'string',
							meta: {
								width: 'half',
								note: '$t:interfaces.super-header.actions.type.note',
								interface: 'select-dropdown',
								default_value: 'normal',
								options: {
									choices: [
										{ text: '$t:interfaces.super-header.actions.type.choices.primary', value: 'normal' },
										{ text: '$t:interfaces.super-header.actions.type.choices.secondary', value: 'secondary' },
										{ text: '$t:interfaces.super-header.actions.type.choices.info', value: 'info' },
										{ text: '$t:interfaces.super-header.actions.type.choices.success', value: 'success' },
										{ text: '$t:interfaces.super-header.actions.type.choices.warning', value: 'warning' },
										{ text: '$t:interfaces.super-header.actions.type.choices.danger', value: 'danger' },
									],
								},
							},
							schema: {
								default_value: 'normal',
							},
						},
						{
							field: 'actionType',
							name: '$t:interfaces.super-header.actions.action_type.name',
							type: 'string',
							meta: {
								width: 'half',
								interface: 'select-dropdown',
								note: '$t:interfaces.super-header.actions.action_type.note',
								options: {
									choices: [
										{ text: '$t:interfaces.super-header.actions.action_type.link', value: 'link' },
										{ text: '$t:interfaces.super-header.actions.action_type.flow', value: 'flow' },
									],
								},
							},
							schema: {
								default_value: 'link',
							},
						},
						{
							field: 'url',
							type: 'string',
							name: '$t:interfaces.super-header.actions.url.name',
							meta: {
								width: 'full',
								interface: 'system-display-template',
								note: '$t:interfaces.super-header.actions.action_type.url.note',
								options: {
									collectionName: collection,
									font: 'monospace',
									placeholder: '$t:interfaces.super-header.actions.action_type.url.placeholder',
								},
								hidden: true,
								conditions: [
									{
										rule: {
											actionType: {
												_eq: 'link',
											},
										},
										hidden: false,
									},
								],
							},
						},
						{
							field: 'flow',
							type: 'string',
							name: '$t:interfaces.super-header.actions.action_type.flow.name',
							meta: {
								width: 'full',
								interface: 'collection-item-dropdown',
								note: '$t:interfaces.super-header.actions.action_type.flow.note',
								hidden: true,
								options: {
									selectedCollection: 'directus_flows',
									placeholder: '$t:interfaces.super-header.actions.action_type.flow.placeholder',
									template: '{{ name }}',
									filter: {
										trigger: {
											_eq: 'manual',
										},
									},
								},
								conditions: [
									{
										rule: {
											actionType: {
												_eq: 'flow',
											},
										},
										hidden: false,
									},
								],
							},
						},
					],
				},
			},
		},
	],
});
