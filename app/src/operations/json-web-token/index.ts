import { defineOperationApp } from '@directus/extensions';

export default defineOperationApp({
	id: 'json-web-token',
	icon: 'key',
	name: '$t:operations.json-web-token.name',
	description: '$t:operations.json-web-token.description',
	overview: ({ operation }) => [
		{
			label: '$t:operations.json-web-token.operation',
			text: operation,
		},
	],
	options: (panel) => {
		const operation = panel.operation;

		const fields: any = [
			{
				field: 'operation',
				name: '$t:operations.json-web-token.operation',
				type: 'string',
				meta: {
					width: 'full',
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: '$t:operations.json-web-token.sign',
								value: 'sign',
							},
							{
								text: '$t:operations.json-web-token.verify',
								value: 'verify',
							},
							{
								text: '$t:operations.json-web-token.decode',
								value: 'decode',
							},
						],
					},
				},
			},
		];

		const secretField = {
			field: 'secret',
			name: '$t:operations.json-web-token.secret',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input',
				options: {
					placeholder: '$t:operations.json-web-token.secret_placeholder',
				},
			},
		};

		const payloadField = {
			field: 'payload',
			name: '$t:operations.json-web-token.payload',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'input-multiline',
				options: {
					font: 'monospace',
					placeholder: '$t:any_string_or_json',
				},
			},
		};

		const tokenField = {
			field: 'token',
			name: '$t:operations.json-web-token.token',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input',
				options: {
					placeholder: '$t:operations.json-web-token.token_placeholder',
				},
			},
		};

		const optionsField = {
			field: 'options',
			name: '$t:operations.json-web-token.options',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'input-code',
				options: {
					language: 'json',
					placeholder: '$t:operations.json-web-token.options_placeholder',
				},
			},
		};

		switch (operation) {
			case 'sign':
				fields.push(payloadField, secretField, optionsField);
				break;
			case 'verify':
				fields.push(tokenField, secretField, optionsField);
				break;
			case 'decode':
				fields.push(tokenField, optionsField);
				break;
		}

		return fields;
	},
});
