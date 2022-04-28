import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'mail',
	icon: 'mail',
	name: '$t:operations.mail.name',
	description: '$t:operations.mail.description',
	preview: ({ subject, to, template }) => [
		{
			label: '$t:subject',
			text: subject,
		},
		{
			label: '$t:operations.mail.to',
			text: to,
		},
		{
			label: '$t:operations.mail.template',
			text: template,
		},
	],
	options: [
		{
			field: 'to',
			name: '$t:operations.mail.to',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'tags',
				options: {
					placeholder: '$t:operations.mail.to_placeholder',
					iconRight: 'alternate_email',
				},
			},
		},
		{
			field: 'subject',
			name: '$t:subject',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input',
				options: {
					iconRight: 'title',
				},
			},
		},
		{
			field: 'template',
			name: '$t:operations.mail.template',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input-rich-text-md',
			},
		},
		{
			field: 'data',
			name: '$t:operations.mail.data',
			type: 'string',
			meta: {
				interface: 'input-code',
			},
		},
	],
});
