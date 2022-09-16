import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'mail',
	icon: 'mail',
	name: '$t:operations.mail.name',
	description: '$t:operations.mail.description',
	overview: ({ subject, to, type, body }) => [
		{
			label: '$t:subject',
			text: subject,
		},
		{
			label: '$t:operations.mail.to',
			text: Array.isArray(to) ? to.join(', ') : to,
		},
		{
			label: '$t:type',
			text: type || 'markdown',
		},
		{
			label: '$t:operations.mail.body',
			text: body,
		},
	],
	options: (panel) => {
		return [
			{
				field: 'to',
				name: '$t:operations.mail.to',
				type: 'csv',
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
				field: 'type',
				name: '$t:type',
				type: 'string',
				schema: {
					default_value: 'markdown',
				},
				meta: {
					interface: 'select-dropdown',
					width: 'half',
					options: {
						choices: [
							{
								text: '$t:interfaces.input-rich-text-md.markdown',
								value: 'markdown',
							},
							{
								text: '$t:interfaces.input-rich-text-html.wysiwyg',
								value: 'wysiwyg',
							},
						],
					},
				},
			},
			{
				field: 'body',
				name: '$t:operations.mail.body',
				type: 'text',
				meta: {
					width: 'full',
					interface: panel.type === 'wysiwyg' ? 'input-rich-text-html' : 'input-rich-text-md',
				},
			},
		];
	},
});
