import { defineOperationApp } from '@directus/extensions';
import { ErrorCode } from '@directus/errors';

export default defineOperationApp({
	id: 'error',
	icon: 'error',
	name: '$t:operations.error.name',
	description: '$t:operations.error.description',
	overview: ({ filter, status, message }) => [
		{
			label: '$t:operations.error.code',
			text: filter,
		},
		{
			label: '$t:operations.error.status',
			text: status,
		},
		{
			label: '$t:operations.error.message',
			text: message,
		},
	],
	options: () => [
		{
			field: 'code',
			name: '$t:operations.error.code',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'select-dropdown',
				options: {
					choices: Object.values(ErrorCode).map((code) => ({
						text: code,
						value: code,
					})),
					allowOther: true,
				},
			},
		},
		{
			field: 'status',
			name: '$t:operations.error.status',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'select-dropdown',
				options: {
					choices: [
						{
							text: '400 (Bad Request)',
							value: '400',
						},
						{
							text: '401 (Unauthorized)',
							value: '401',
						},
						{
							text: '403 (Forbidden)',
							value: '403',
						},
						{
							text: '404 (Not Found)',
							value: '404',
						},
						{
							text: '405 (Method Not Allowed)',
							value: '405',
						},
						{
							text: '422 (Unprocessable Entity)',
							value: '422',
						},
						{
							text: '429 (Too Many Requests)',
							value: '429',
						},
						{
							text: '500 (Internal Server Error)',
							value: '500',
						},
					],
					allowOther: true,
				},
			},
		},
		{
			field: 'message',
			name: '$t:operations.error.message',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input',
			},
		},
	],
});
