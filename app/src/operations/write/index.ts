import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'write',
	icon: 'publish',
	name: '$t:operations.write.name',
	description: '$t:operations.write.description',
	preview: ({ mode, collection, payload }) => [
		{
			label: '$t:operations.write.mode.field',
			text: mode,
		},
		{
			label: '$t:collection',
			text: collection,
		},
		{
			label: '$t:operations.write.payload',
			text: payload,
		},
	],
	options: [
		{
			field: 'mode',
			name: '$t:operations.write.mode.field',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{
							text: '$t:operations.write.mode.one',
							value: 'one',
						},
						{
							text: '$t:operations.write.mode.many',
							value: 'many',
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
			field: 'emitEvents',
			name: '$t:operations.write.emit_events',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
			},
			schema: {
				default_value: true,
			},
		},
		{
			field: 'payload',
			name: '$t:operations.write.payload',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input-code',
				options: {
					language: 'json',
				},
			},
		},
	],
});
