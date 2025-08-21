import { defineInterface } from '@directus/extensions';
import SuperHeader from './super-header.vue';

export default defineInterface({
	id: 'super-header',
	name: '$t:interfaces.super-header.super-header',
	description: '$t:interfaces.super-header.description',
	icon: 'exercise',
	component: SuperHeader,
	types: ['string'],
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
	],
});
