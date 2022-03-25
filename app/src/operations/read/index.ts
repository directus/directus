import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'read',
	icon: 'download',
	name: '$t:read',
	description: 'Load items from the database!',
	preview: (options) => ({
		test: 'Hi',
	}),
	options: [
		{
			field: 'mode',
			name: '$t:mode',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
                options: {
                    choices: [
                        {
                            text: '$t:one',
                            value: 'one'
                        },
                        {
                            text: '$t:many',
                            value: 'many'
                        },
                        {
                            text: '$t:query',
                            value: 'query'
                        }
                    ]
                }
			},
		},
        {
            field: 'collection',
            name: '$t:collection',
            type: 'string',
            meta: {
                width: 'half',
                interface: 'system-collection'
            }
        },
        {
            field: 'key',
            name: '$t:key',
            type: 'csv',
            meta: {
                width: 'full',
                interface: 'tags',
            }
        },
        {
            field: 'query',
            name: '$t:query',
            type: 'string',
            meta: {
                width: 'full',
                interface: 'input-code',
                options: {
                    language: 'json'
                }
            }
        }
	],
});
