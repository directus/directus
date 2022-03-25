import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'trigger',
	icon: 'flag',
	name: '$t:operations.trigger.name',
	description: '$t:operations.trigger.description',
	preview: (options) => ({
		test: 'Hi',
	}),
	options: [
		{
			field: 'flows',
			name: '$t:operations.trigger.flows',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'list',
                options: {
                    fields: [
                        {
                            field: 'flow',
                            name: '$t:operations.trigger.flow',
                            type: 'string',
                            meta: {
                                width: 'half',
                                interface: 'input'
                            }
                        },
                        {
                            field: 'data',
                            name: '$t:operations.trigger.data',
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
