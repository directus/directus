import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'request',
	icon: 'cloud_download',
	name: '$t:operations.request.name',
	description: '$t:operations.request.description',
	preview: ({ url, method }) => [
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
			type: 'string',
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
			field: 'data',
			name: '$t:operations.request.data',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'input-code',
			},
		},
	],
});
