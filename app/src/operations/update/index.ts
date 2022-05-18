import { defineOperationApp, toArray } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'update',
	icon: 'edit',
	name: '$t:operations.update.name',
	description: '$t:operations.update.description',
	preview: ({ mode, collection, key }) => {
		const previewOptions = [
			{
				label: '$t:operations.update.mode.field',
				text: mode,
			},
			{
				label: '$t:collection',
				text: collection,
			},
		];

		if (mode !== 'query') {
			previewOptions.push({
				label: '$t:operations.update.key',
				text: key ? toArray(key).join(', ') : '--',
			});
		}

		return previewOptions;
	},
	options: [
		{
			field: 'mode',
			name: '$t:operations.update.mode.field',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{
							text: '$t:operations.update.mode.one',
							value: 'one',
						},
						{
							text: '$t:operations.update.mode.many',
							value: 'many',
						},
						{
							text: '$t:operations.update.mode.query',
							value: 'query',
						},
					],
				},
			},
		},
		{
			field: 'permissions',
			name: '$t:permissions',
			type: 'string',
			schema: {
				default_value: '$trigger',
			},
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{
							text: 'From Trigger',
							value: '$trigger',
						},
						{
							text: 'Public Role',
							value: '$public',
						},
						{
							text: 'Full Access',
							value: '$full',
						},
					],
					allowOther: true,
				},
			},
		},
		{
			field: 'collection',
			name: '$t:collection',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'system-collection',
			},
		},
		{
			field: 'key',
			name: '$t:operations.update.key',
			type: 'csv',
			meta: {
				width: 'half',
				interface: 'tags',
				options: {
					iconRight: 'vpn_key',
				},
				conditions: [
					{
						rule: {
							mode: {
								_eq: 'query',
							},
						},
						hidden: true,
					},
				],
			},
		},
		{
			field: 'payload',
			name: '$t:operations.update.payload',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input-code',
				options: {
					language: 'json',
				},
			},
		},
		{
			field: 'query',
			name: '$t:operations.update.query',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input-code',
				options: {
					language: 'json',
				},
				conditions: [
					{
						rule: {
							mode: {
								_neq: 'query',
							},
						},
						hidden: true,
					},
				],
			},
		},
	],
});
