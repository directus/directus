import Knex from 'knex';

export async function up(knex: Knex) {
	await knex('directus_fields')
		.update({
			options: {
				fields: [
					{
						field: 'key',
						name: 'Key',
						type: 'string',
						meta: {
							interface: 'slug',
							options: {
								onlyOnCreate: false,
							},
							required: true,
							width: 'half',
						},
					},
					{
						field: 'fit',
						name: 'Fit',
						type: 'string',
						meta: {
							interface: 'dropdown',
							options: {
								choices: [
									{
										value: 'contain',
										text: 'Contain (preserve aspect ratio)',
									},
									{
										value: 'cover',
										text: 'Cover (forces exact size)',
									},
									{
										value: 'inside',
										text: 'Fit inside',
									},
									{
										value: 'outside',
										text: 'Fit outside',
									},
								],
							},
							required: true,
							width: 'half',
						},
					},
					{
						field: 'width',
						name: 'Width',
						type: 'integer',
						meta: {
							interface: 'numeric',
							required: true,
							width: 'half',
						},
					},
					{
						field: 'height',
						name: 'Height',
						type: 'integer',
						meta: {
							interface: 'numeric',
							required: true,
							width: 'half',
						},
					},
					{
						field: 'withoutEnlargement',
						type: 'boolean',
						schema: {
							default_value: false,
						},
						meta: {
							interface: 'toggle',
							width: 'half',
							options: {
								label: `Don't upscale images`,
							},
						},
					},
					{
						field: 'quality',
						type: 'integer',
						name: 'Quality',
						schema: {
							default_value: 80,
						},
						meta: {
							interface: 'slider',
							options: {
								max: 100,
								min: 0,
								step: 1,
							},
							required: true,
							width: 'half',
						},
					},
				],
				template: '{{key}}',
			},
		})
		.where({ field: 'storage_asset_presets', collection: 'directus_settings' });
}

export async function down(knex: Knex) {
	await knex('directus_fields')
		.update({
			options: {
				fields: [
					{
						field: 'key',
						name: 'Key',
						type: 'string',
						meta: {
							interface: 'slug',
							options: {
								onlyOnCreate: false,
							},
							required: true,
							width: 'half',
						},
					},
					{
						field: 'fit',
						name: 'Fit',
						type: 'string',
						meta: {
							interface: 'dropdown',
							options: {
								choices: [
									{
										value: 'contain',
										text: 'Contain (preserve aspect ratio)',
									},
									{
										value: 'cover',
										text: 'Cover (forces exact size)',
									},
								],
							},
							required: true,
							width: 'half',
						},
					},
					{
						field: 'width',
						name: 'Width',
						type: 'integer',
						meta: {
							interface: 'numeric',
							required: true,
							width: 'half',
						},
					},
					{
						field: 'height',
						name: 'Height',
						type: 'integer',
						meta: {
							interface: 'numeric',
							required: true,
							width: 'half',
						},
					},
					{
						field: 'quality',
						type: 'integer',
						name: 'Quality',
						schema: {
							default_value: 80,
						},
						meta: {
							interface: 'slider',
							options: {
								max: 100,
								min: 0,
								step: 1,
							},
							required: true,
							width: 'full',
						},
					},
				],
				template: '{{key}}',
			},
		})
		.where({ field: 'storage_asset_presets', collection: 'directus_settings' });
}
