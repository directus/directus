import { defineOperationApp } from '@directus/extensions';

export default defineOperationApp({
	id: 'request',
	icon: 'link',
	name: '$t:operations.request.name',
	description: '$t:operations.request.description',
	overview: ({ url, method }) => [
		{
			label: '$t:operations.request.url',
			text: url,
		},
		{
			label: '$t:operations.request.method',
			text: method ?? 'GET',
		},
	],
	options: [
		{
			field: 'method',
			name: '$t:operations.request.method',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{ value: 'GET', text: 'GET' },
						{ value: 'POST', text: 'POST' },
						{ value: 'PATCH', text: 'PATCH' },
						{ value: 'DELETE', text: 'DELETE' },
					],
					allowOther: true,
				},
			},
			schema: {
				default_value: 'GET',
			},
		},
		{
			field: 'url',
			name: '$t:operations.request.url',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
				options: {
					placeholder: '$t:operations.request.url_placeholder',
				},
			},
		},
		{
			field: 'headers',
			name: '$t:operations.request.headers',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'list',
				options: {
					fields: [
						{
							field: 'header',
							name: '$t:operations.request.header',
							type: 'string',
							meta: {
								width: 'half',
								interface: 'input',
								required: true,
								options: {
									placeholder: '$t:operations.request.header_placeholder',
								},
							},
						},
						{
							field: 'value',
							name: '$t:value',
							type: 'string',
							meta: {
								width: 'half',
								interface: 'input',
								required: true,
								options: {
									placeholder: '$t:operations.request.value_placeholder',
								},
							},
						},
					],
				},
			},
		},
		{
			field: 'body',
			name: '$t:request_body',
			type: 'text',
			meta: {
				width: 'full',
				interface: 'input-multiline',
				options: {
					font: 'monospace',
					placeholder: '$t:any_string_or_json',
				},
			},
		},
	],
});
