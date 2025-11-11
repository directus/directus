import { defineInterface } from '@directus/extensions';
import InterfaceHeader from './header.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'header',
	name: '$t:interfaces.header.header',
	description: '$t:interfaces.header.description',
	icon: 'exercise',
	component: InterfaceHeader,
	types: ['alias'],
	localTypes: ['presentation'],
	group: 'presentation',
	autoKey: true,
	hideLabel: true,
	options: ({ collection }) => [
		{
			field: 'title',
			name: '$t:title',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'system-display-template',
				options: {
					collectionName: collection,
				},
			},
		},
		{
			field: 'color',
			name: '$t:color',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-color',
			},
		},
		{
			field: 'icon',
			name: '$t:icon',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-icon',
			},
		},
		{
			field: 'subtitle',
			name: '$t:subtitle',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'system-display-template',
				options: {
					collectionName: collection,
				},
			},
		},
		{
			field: 'help',
			name: '$t:interfaces.header.help',
			type: 'text',
			meta: {
				width: 'full',
				interface: 'input-rich-text-html',
			},
		},
		{
			field: 'helpDisplayMode',
			name: '$t:interfaces.header.help_display_mode',
			type: 'string',
			schema: {
				default_value: 'inline',
			},
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{ text: '$t:inline', value: 'inline' },
						{ text: '$t:modal', value: 'modal' },
					],
				},
			},
		},
		{
			field: 'enableHelpTranslations',
			name: '$t:interfaces.header.enable_help_translations',
			type: 'boolean',
			meta: {
				width: 'half',
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'helpTranslationsString',
			name: '$t:interfaces.header.help_translations_string',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'system-input-translated-string',
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
			field: 'links',
			name: '$t:interfaces.header.links',
			type: 'json',
			meta: {
				interface: 'list',
				options: {
					fields: [
						{
							field: 'label',
							type: 'string',
							name: '$t:label',
							meta: {
								width: 'full',
								interface: 'system-input-translated-string',
								options: {
									placeholder: '$t:label',
								},
							},
						},
						{
							field: 'icon',
							name: '$t:icon',
							type: 'string',
							meta: {
								width: 'half',
								interface: 'select-icon',
							},
						},
						{
							field: 'type',
							name: '$t:type',
							type: 'string',
							meta: {
								width: 'half',
								interface: 'select-dropdown',
								default_value: 'normal',
								options: {
									choices: [
										{ text: '$t:normal', value: 'normal' },
										{ text: '$t:primary', value: 'primary' },
										{ text: '$t:info', value: 'info' },
										{ text: '$t:success', value: 'success' },
										{ text: '$t:warning', value: 'warning' },
										{ text: '$t:danger', value: 'danger' },
									],
								},
							},
							schema: {
								default_value: 'normal',
							},
						},
						{
							field: 'actionType',
							type: 'string',
							name: '$t:interfaces.header.action_type',
							schema: {
								default_value: 'url',
							},
							meta: {
								interface: 'select-dropdown',
								options: {
									choices: [
										{ text: '$t:url', value: 'url' },
										{ text: '$t:flow', value: 'flow' },
									],
								},
							},
						},
						{
							field: 'url',
							type: 'string',
							name: '$t:url',
							meta: {
								width: 'full',
								interface: 'system-display-template',
								options: {
									collectionName: collection,
									font: 'monospace',
									placeholder: 'https://example.com/articles/{{ id }}/{{ slug }}',
								},
								conditions: [
									{
										rule: {
											actionType: {
												_eq: 'flow',
											},
										},
										hidden: true,
									},
								],
							},
						},
						{
							field: 'flow',
							type: 'string',
							name: '$t:flow',
							meta: {
								width: 'full',
								interface: 'system-manual-flow-select',
								options: {
									collectionName: collection,
								},
								conditions: [
									{
										rule: {
											actionType: {
												_eq: 'url',
											},
										},
										hidden: true,
									},
								],
							},
						},
					],
				},
			},
		},
	],
	preview: PreviewSVG,
});
