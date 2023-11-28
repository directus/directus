import { defineOperationApp } from '@directus/extensions';
import { toArray } from '@directus/utils';

export default defineOperationApp({
	id: 'item-update',
	icon: 'edit',
	name: '$t:operations.item-update.name',
	description: '$t:operations.item-update.description',
	overview: ({ collection, key }) => {
		const overviewItems = [
			{
				label: '$t:collection',
				text: collection,
			},
			{
				label: '$t:operations.item-update.key',
				text: toArray(key).length > 0 ? toArray(key).join(', ') : '--',
			},
		];

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
			name: '$t:operations.item-update.emit_events',
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
			name: '$t:operations.item-update.key',
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
			field: 'payload',
			name: '$t:operations.item-update.payload',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'input-code',
				options: {
					language: 'json',
					placeholder: '$t:item_payload_placeholder',
				},
			},
		},
		{
			field: 'query',
			name: '$t:operations.item-update.query',
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
	],
});
