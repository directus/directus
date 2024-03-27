import { defineOperationApp } from '@directus/extensions';
import { toArray } from '@directus/utils';

export default defineOperationApp({
	id: 'item-read',
	icon: 'visibility',
	name: '$t:operations.item-read.name',
	description: '$t:operations.item-read.description',
	overview: ({ collection, key }) => {
		const overviewItems = [
			{
				label: '$t:collection',
				text: collection,
			},
			{
				label: '$t:operations.item-read.key',
				text: toArray(key).length > 0 ? toArray(key).join(', ') : '--',
			},
		];

		return overviewItems;
	},
	options: [
		{
			field: 'permissions',
			name: '$t:permissions',
			type: 'string',
			schema: {
				default_value: '$trigger',
			},
			meta: {
				width: 'full',
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
			name: '$t:operations.item-read.key',
			type: 'csv',
			meta: {
				width: 'half',
				interface: 'tags',
				options: {
					iconRight: 'vpn_key',
				},
			},
		},
		{
			field: 'query',
			name: '$t:operations.item-read.query',
			type: 'json',
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
						2,
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
						2,
					),
				},
			},
		},
		{
			field: 'emitEvents',
			name: '$t:operations.item-create.emit_events',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
			},
			schema: {
				default_value: false,
			},
		},
	],
});
