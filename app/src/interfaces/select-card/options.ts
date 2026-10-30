import type { AppField, DeepPartial, Field } from '@directus/types';

export function getCardSelectOptions(id: string, valueType: Field['type'] = 'string'): DeepPartial<AppField>[] {
	return [
		{
			field: 'choices',
			type: 'json',
			name: '$t:choices',
			meta: {
				width: 'full',
				interface: 'list',
				options: {
					template: '{{ text }}',
					fields: [
						{
							field: 'text',
							type: 'string',
							name: '$t:text',
							meta: {
								width: 'half',
								required: true,
								interface: 'system-input-translated-string',
							},
						},
						{
							field: 'value',
							type: valueType,
							name: '$t:value',
							meta: {
								width: 'half',
								interface: 'input',
								required: true,
								options: {
									font: 'monospace',
								},
							},
						},
						{
							field: 'description',
							type: 'string',
							name: '$t:description',
							meta: {
								width: 'full',
								interface: 'system-input-translated-string',
								note: `$t:interfaces.${id}.description_note`,
							},
						},
						{
							field: 'icon_type',
							type: 'string',
							name: `$t:interfaces.${id}.icon_type`,
							meta: {
								width: 'full',
								interface: 'select-radio',
								options: {
									choices: [
										{ text: '$t:icon', value: 'icon' },
										{ text: '$t:image', value: 'image' },
									],
								},
							},
							schema: {
								default_value: 'icon',
							},
						},
						{
							field: 'icon',
							name: '$t:icon',
							type: 'string',
							meta: {
								width: 'full',
								interface: 'select-icon',
								hidden: true,
								conditions: [
									{
										hidden: false,
										rule: {
											_and: [{ icon_type: { _eq: 'icon' } }],
										},
									},
								],
							},
						},
						{
							field: 'image',
							name: '$t:image',
							type: 'string',
							meta: {
								width: 'full',
								interface: 'system-file-image',
								hidden: true,
								conditions: [
									{
										hidden: false,
										rule: {
											_and: [{ icon_type: { _eq: 'image' } }],
										},
									},
								],
							},
						},
					],
				},
			},
		},
		{
			field: 'size',
			type: 'string',
			name: '$t:card_size',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{ text: '$t:small', value: 'small' },
						{ text: '$t:medium', value: 'medium' },
						{ text: '$t:large', value: 'large' },
					],
				},
			},
			schema: {
				default_value: 'medium',
			},
		},
	];
}
