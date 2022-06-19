import { defineOperationApp } from '@directus/shared/utils';
import { toArray } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'item-delete',
	icon: 'delete',
	name: '$t:operations.item-delete.name',
	description: '$t:operations.item-delete.description',
	overview: ({ mode, collection, key }) => {
		const overviewItems = [
			{
				label: '$t:collection',
				text: collection,
			},
		];

		if (mode !== 'query') {
			overviewItems.push({
				label: '$t:operations.item-delete.key',
				text: key ? toArray(key).join(', ') : '--',
			});
		}

		return overviewItems;
	},
	options: [
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
			field: 'emitEvents',
			name: '$t:operations.item-delete.emit_events',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'key',
			name: '$t:operations.item-delete.key',
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
			field: 'query',
			name: '$t:operations.item-delete.query',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input-code',
				options: {
					language: 'json',
					placeholder: JSON.stringify(
						{
							filter: {
								status: {
									_eq: 'active',
								},
							},
						},
						null,
						2
					),
					template: JSON.stringify(
						{
							filter: {
								status: {
									_eq: 'active',
								},
							},
						},
						null,
						2
					),
				},
			},
		},
	],
});
