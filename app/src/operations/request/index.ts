import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'request',
	icon: 'cloud_download',
	name: '$t:request',
	description: 'Make a request!',
	preview: (options) => ({
		test: 'Hi',
	}),
	options: [
		{
			field: 'url',
			name: '$t:url',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
			},
		},
        {
			field: 'method',
			name: '$t:method',
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
			name: '$t:data',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'input-code',
			},
		},
        {
			field: 'headers',
			name: '$t:headers',
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
