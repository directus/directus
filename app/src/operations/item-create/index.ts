import { defineOperationApp } from '@directus/extensions';

export default defineOperationApp({
	id: 'item-create',
	icon: 'add',
	name: '$t:operations.item-create.name',
	description: '$t:operations.item-create.description',
	overview: ({ collection, payload }) => [
		{
			label: '$t:collection',
			text: collection,
		},
		{
			label: '$t:operations.item-create.payload',
			text: payload,
		},
	],
	options: [
		{
			field: 'collection',
			name: '$t:collection',
			type: 'string',
			meta: {
				required: true,
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
		{
			field: 'payload',
			name: '$t:operations.item-create.payload',
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
	],
});
