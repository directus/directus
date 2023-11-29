import { DeepPartial, Field } from '@directus/types';

export const themingProjectFields: DeepPartial<Field>[] = [
	{
		name: '$t:settings_appearance',
		collection: 'directus_settings',
		field: 'default_appearance',
		type: 'string',
		meta: {
			interface: 'select-dropdown',
			options: {
				choices: [
					{ value: 'auto', text: '$t:appearance_auto' },
					{ value: 'light', text: '$t:appearance_light' },
					{ value: 'dark', text: '$t:appearance_dark' },
				],
			},
			width: 'half',
		},
	},
	{
		name: '$t:theme_light',
		collection: 'directus_settings',
		field: 'default_theme_light',
		type: 'string',
		meta: {
			interface: 'system-theme',
			options: { appearance: 'light' },
			width: 'full',
		},
	},
	{
		name: '$t:theme_dark',
		field: 'default_theme_dark',
		type: 'string',
		meta: {
			interface: 'system-theme',
			options: { appearance: 'dark' },
			width: 'full',
		},
	},
];
