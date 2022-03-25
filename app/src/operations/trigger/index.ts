import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'trigger',
	icon: 'flag',
	name: '$t:trigger',
	description: 'Start another flow!',
	preview: (options) => ({
		test: 'Hi',
	}),
	options: [
		{
			field: 'flows',
			name: '$t:flows',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'list',
                options: {
                    fields: [
                        {
                            field: 'flow',
                            name: '$t:flow',
                            type: 'string',
                            meta: {
                                width: 'half',
                                interface: 'input'
                            }
                        },
                        {
                            field: 'data',
                            name: '$t:data',
                            type: 'string',
                            meta: {
                                width: 'full',
                                interface: 'input-code',
                                options: {
                                    language: 'json'
                                }
                            }
                        }
                    ]
                }
			},
		},
	],
});
