import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'mail',
	icon: 'mail',
	name: '$t:operations.mail.name',
	description: '$t:operations.mail.description',
	overview: ({ subject, to, body }) => [
		{
			label: '$t:subject',
			text: subject,
		},
		{
			label: '$t:operations.mail.to',
			text: Array.isArray(to) ? to.join(', ') : to,
		},
		{
			label: '$t:operations.mail.body',
			text: body,
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
			field: 'body',
			name: '$t:operations.mail.body',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input-rich-text-md',
			},
		},
	],
});
