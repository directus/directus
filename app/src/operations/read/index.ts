import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'read',
	icon: 'download',
	name: '$t:operations.read.name',
	description: '$t:operations.read.description',
	preview: ({ name, options }) => `
# ${name}
**$t:operations.read.mode.field**: ${options.mode}\n
**$t:collection**: ${options.collection}\n
**$t:operations.read.key**: ${options.key}
	`,
	options: [
		{
			field: 'mode',
			name: '$t:operations.read.mode.field',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{
							text: '$t:operations.read.mode.one',
							value: 'one',
						},
						{
							text: '$t:operations.read.mode.many',
							value: 'many',
						},
						{
							text: '$t:operations.read.mode.query',
							value: 'query',
						},
					],
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
			name: '$t:operations.read.key',
			type: 'csv',
			meta: {
				width: 'full',
				interface: 'tags',
			},
		},
		{
			field: 'query',
			name: '$t:operations.read.query',
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
