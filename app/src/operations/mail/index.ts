import { defineOperationApp } from '@directus/extensions';

export default defineOperationApp({
	id: 'mail',
	icon: 'mail',
	name: '$t:operations.mail.name',
	description: '$t:operations.mail.description',
	overview: ({ subject, to, type, cc, bcc, replyTo }) => [
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
		...[
			cc && {
				label: '$t:operations.mail.cc',
				text: Array.isArray(cc) ? cc.join(', ') : cc,
			},
			bcc && {
				label: '$t:operations.mail.bcc',
				text: Array.isArray(bcc) ? bcc.join(', ') : bcc,
			},
			replyTo && {
				label: '$t:operations.mail.reply_to',
				text: Array.isArray(replyTo) ? replyTo.join(', ') : replyTo,
			},
		].filter((v) => v),
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
				field: 'cc',
				name: '$t:operations.mail.cc',
				type: 'csv',
				meta: {
					width: 'full',
					interface: 'tags',
					options: {
						placeholder: '$t:operations.mail.cc_placeholder',
						iconRight: 'alternate_email',
					},
				},
			},
			{
				field: 'bcc',
				name: '$t:operations.mail.bcc',
				type: 'csv',
				meta: {
					width: 'full',
					interface: 'tags',
					options: {
						placeholder: '$t:operations.mail.bcc_placeholder',
						iconRight: 'alternate_email',
					},
				},
			},
			{
				field: 'replyTo',
				name: '$t:operations.mail.reply_to',
				type: 'csv',
				meta: {
					width: 'full',
					interface: 'tags',
					options: {
						placeholder: '$t:operations.mail.reply_to_placeholder',
						iconRight: 'reply',
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
							{
								text: '$t:operations.mail.template',
								value: 'template',
							},
						],
					},
				},
			},
			{
				field: 'template',
				name: '$t:operations.mail.template',
				type: 'string',
				meta: {
					interface: 'input',
					hidden: panel.type !== 'template',
					width: 'half',
					options: {
						placeholder: 'base',
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
					hidden: panel.type === 'template',
				},
			},
			{
				field: 'data',
				name: '$t:operations.mail.data',
				type: 'json',
				meta: {
					width: 'full',
					interface: 'input-code',
					hidden: panel.type !== 'template',
					options: {
						language: 'json',
						placeholder: JSON.stringify(
							{
								url: 'example.com',
							},
							null,
							2,
						),
						template: JSON.stringify(
							{
								url: 'example.com',
							},
							null,
							2,
						),
					},
				},
			},
		];
	},
});
