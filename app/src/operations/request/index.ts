import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'request',
	icon: 'cloud_download',
	name: '$t:operations.request.name',
	description: '$t:operations.request.description',
	preview: (options) => ({
		test: 'Hi',
	}),
	options: [
		{
			field: 'url',
			name: '$t:operations.request.url',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
				options: {
					placeholder: '$t:operations.request.url_placeholder'
				}
			},
		},
        {
			field: 'method',
			name: '$t:operations.request.method',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
                options: {
                    choices: [
                        {value: 'GET', text: 'GET'},
                        {value: 'POST', text: 'POST'},
                        {value: 'PATCH', text: 'PATCH'},
                        {value: 'DELETE', text: 'DELETE'},
                        {value: 'HEAD', text: 'HEAD'},
                        {value: 'OPTIONS', text: 'OPTIONS'},
                        {value: 'PUT', text: 'PUT'},
                        {value: 'PURGE', text: 'PURGE'},
                        {value: 'LINK', text: 'LINK'},
                        {value: 'UNLINK', text: 'UNLINK'},
                    ]
                }
			},
		},
        {
			field: 'data',
			name: '$t:operations.request.data',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'input-code',
			},
		},
        {
			field: 'headers',
			name: '$t:operations.request.headers',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'list',
                options: {
                    fields: [
                        {
                            field: 'header',
                            name: '$t:header',
                            type: 'string',
                            meta: {
                                width: 'half',
                                interface: 'input'
                            }
                        },
                        {
                            field: 'value',
                            name: '$t:value',
                            type: 'string',
                            meta: {
                                width: 'half',
                                interface: 'input'
                            }
                        }
                    ]
                }
			},
		},
	],
});
