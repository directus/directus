import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'mail',
	icon: 'mail',
	name: '$t:operations.mail.name',
	description: '$t:operations.mail.description',
	overview: ({ subject, to, body_wysiwyg, body_markdown, use_wysiwyg_editor }) => [
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
			text: use_wysiwyg_editor ? body_wysiwyg : body_markdown,
		},
	],
	options: [
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
			field: 'use_wysiwyg_editor',
			name: '$t:use_wysiwyg_editor',
			type: 'boolean',
			schema: {
				default_value: false,
			},
			meta: {
				width: 'full',
				interface: 'boolean',
				options: {
					label: 'Yes',
				},
			},
		},
		{
			field: 'body_markdown',
			name: '$t:operations.mail.body',
			type: 'text',
			meta: {
				width: 'full',
				interface: 'input-rich-text-md',
				required: true,
				hidden: false,
				conditions: [
					{
						name: 'If NOT Use WYSIWYG Editor',
						rule: {
							_and: [
								{
									use_wysiwyg_editor: {
										_eq: true,
									},
								},
							],
						},
						hidden: true,
						required: false,
						options: {},
						readonly: false,
					},
				],
			},
		},
		{
			field: 'body_wysiwyg',
			name: '$t:operations.mail.body',
			type: 'text',
			meta: {
				width: 'full',
				interface: 'input-rich-text-html',
				required: false,
				hidden: true,
				conditions: [
					{
						name: 'If Use WYSIWYG Editor',
						rule: {
							_and: [
								{
									use_wysiwyg_editor: {
										_eq: true,
									},
								},
							],
						},
						hidden: false,
						required: true,
						options: {},
						readonly: false,
					},
				],
			},
		},
	],
});
