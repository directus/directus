import type { DeepPartial, Field } from '@directus/types';

export const REQUIRED_FIELDS: Pick<Field, 'field' | 'type'>[] = [
	{
		field: 'name',
		type: 'string',
	},
	{
		field: 'description',
		type: 'text',
	},
	{
		field: 'system_prompt',
		type: 'text',
	},
	{
		field: 'messages',
		type: 'json',
	},
] as const;

export function generateFields(collection: string | null, fields: string[] | null): DeepPartial<Field>[] {
	collection = collection ?? 'ai_prompts';

	const schema: DeepPartial<Field>[] = [
		{
			collection,
			field: 'id',
			type: 'uuid',
			schema: {
				name: 'id',
				table: 'ai_prompts',
				data_type: 'uuid',
				is_unique: true,
				is_primary_key: true,
			},
			meta: {
				collection,
				field: 'id',
				special: ['uuid'],
				interface: 'input',
				sort: 1,
				hidden: true,
				width: 'half',
			},
		},
		{
			collection,
			field: 'sort',
			type: 'integer',
			schema: {
				name: 'sort',
				table: 'ai_prompts',
				data_type: 'integer',
				numeric_precision: 32,
				numeric_scale: 0,
				is_nullable: true,
			},
			meta: {
				collection,
				field: 'sort',
				interface: 'input',
				hidden: true,
				sort: 2,
				width: 'half',
			},
		},
		{
			collection,
			field: 'date_created',
			type: 'timestamp',
			schema: {
				name: 'date_created',
				table: 'ai_prompts',
				data_type: 'timestamp with time zone',
				default_value: 'CURRENT_TIMESTAMP',
				is_nullable: true,
			},
			meta: {
				collection,
				field: 'date_created',
				special: ['date-created'],
				interface: 'datetime',
				display: 'datetime',
				display_options: {
					relative: true,
				},
				readonly: true,
				hidden: true,
				sort: 3,
				width: 'half',
			},
		},
		{
			collection,
			field: 'user_created',
			type: 'uuid',
			schema: {
				name: 'user_created',
				table: 'ai_prompts',
				data_type: 'uuid',
				is_nullable: true,
				foreign_key_schema: 'public',
				foreign_key_table: 'directus_users',
				foreign_key_column: 'id',
			},
			meta: {
				collection,
				field: 'user_created',
				special: ['user-created'],
				interface: 'select-dropdown-m2o',
				options: {
					template: '{{avatar}} {{first_name}} {{last_name}}',
				},
				display: 'user',
				readonly: true,
				hidden: true,
				sort: 4,
				width: 'half',
			},
		},
		{
			collection,
			field: 'date_updated',
			type: 'timestamp',
			schema: {
				name: 'date_updated',
				table: 'ai_prompts',
				data_type: 'timestamp with time zone',
				is_nullable: true,
			},
			meta: {
				collection,
				field: 'date_updated',
				special: ['date-updated'],
				interface: 'datetime',
				display: 'datetime',
				display_options: {
					relative: true,
				},
				readonly: true,
				hidden: true,
				sort: 5,
				width: 'half',
			},
		},
		{
			collection,
			field: 'user_updated',
			type: 'uuid',
			schema: {
				name: 'user_updated',
				table: 'ai_prompts',
				data_type: 'uuid',
				is_nullable: true,
				foreign_key_schema: 'public',
				foreign_key_table: 'directus_users',
				foreign_key_column: 'id',
			},
			meta: {
				collection,
				field: 'user_updated',
				special: ['user-updated'],
				interface: 'select-dropdown-m2o',
				options: {
					template: '{{avatar}} {{first_name}} {{last_name}}',
				},
				display: 'user',
				readonly: true,
				hidden: true,
				sort: 6,
				width: 'half',
			},
		},
		{
			collection,
			field: 'meta_prompts_notice',
			type: 'alias',
			schema: null,
			meta: {
				collection,
				field: 'meta_prompts_notice',
				special: ['alias', 'no-data'],
				interface: 'presentation-notice',
				options: {
					icon: 'info',
					text: '$t:mcp_prompts_collection_schema.meta_prompts_notice',
				},
				sort: 7,
				width: 'full',
			},
		},
		{
			collection,
			field: 'name',
			type: 'string',
			schema: {
				name: 'name',
				table: 'ai_prompts',
				data_type: 'character varying',
				max_length: 255,
				is_nullable: true,
				is_unique: true,
				is_indexed: true,
			},
			meta: {
				collection,
				field: 'name',
				interface: 'input',
				options: {
					slug: true,
					trim: true,
				},
				display: 'formatted-value',
				display_options: {
					font: 'monospace',
				},
				sort: 8,
				width: 'half',
				required: true,
			},
		},
		{
			collection,
			field: 'status',
			type: 'string',
			schema: {
				name: 'status',
				table: 'ai_prompts',
				data_type: 'character varying',
				default_value: 'draft',
				max_length: 255,
			},
			meta: {
				collection,
				field: 'status',
				interface: 'select-dropdown',
				options: {
					choices: [
						{
							text: '$t:published',
							value: 'published',
							color: 'var(--theme--primary)',
						},
						{
							text: '$t:draft',
							value: 'draft',
							color: 'var(--theme--foreground)',
						},
						{
							text: '$t:archived',
							value: 'archived',
							color: 'var(--theme--warning)',
						},
					],
				},
				display: 'labels',
				display_options: {
					choices: [
						{
							text: '$t:published',
							value: 'published',
							color: 'var(--theme--primary)',
							foreground: 'var(--theme--primary)',
							background: 'var(--theme--primary-background)',
						},
						{
							text: '$t:draft',
							value: 'draft',
							color: 'var(--theme--foreground)',
							foreground: 'var(--theme--foreground)',
							background: 'var(--theme--background-normal)',
						},
						{
							text: '$t:archived',
							value: 'archived',
							color: 'var(--theme--warning)',
							foreground: 'var(--theme--warning)',
							background: 'var(--theme--warning-background)',
						},
					],
				},
				sort: 9,
				width: 'half',
			},
		},
		{
			collection,
			field: 'description',
			type: 'text',
			schema: {
				name: 'description',
				table: 'ai_prompts',
				data_type: 'text',
				is_nullable: true,
			},
			meta: {
				collection,
				field: 'description',
				interface: 'input',
				sort: 10,
				width: 'full',
			},
		},

		{
			collection,
			field: 'system_prompt',
			type: 'text',
			schema: {
				name: 'system_prompt',
				table: 'ai_prompts',
				data_type: 'text',
				is_nullable: true,
			},
			meta: {
				collection,
				field: 'system_prompt',
				interface: 'input-rich-text-md',
				sort: 11,
				width: 'full',
				note: '$t:mcp_prompts_collection_schema.system_prompt_note',
			},
		},
		{
			collection,
			field: 'messages',
			type: 'json',
			schema: {
				name: 'messages',
				table: 'ai_prompts',
				data_type: 'json',
				is_nullable: true,
			},
			meta: {
				collection,
				field: 'messages',
				special: ['cast-json'],
				interface: 'list',
				options: {
					fields: [
						{
							field: 'role',
							name: 'role',
							type: 'string',
							meta: {
								field: 'role',
								width: 'full',
								type: 'string',
								required: true,
								note: '$t:mcp_prompts_collection_schema.messages_role_note',
								interface: 'select-dropdown',
								options: {
									choices: [
										{
											text: '$t:mcp_prompts_collection_schema.messages_role_user',
											value: 'user',
											icon: 'person',
										},
										{
											text: '$t:mcp_prompts_collection_schema.messages_role_assistant',
											value: 'assistant',
											icon: 'smart_toy',
										},
									],
								},
								display: 'labels',
								display_options: {
									choices: [
										{
											text: '$t:mcp_prompts_collection_schema.messages_role_user',
											value: 'user',
											icon: 'person',
										},
										{
											text: '$t:mcp_prompts_collection_schema.messages_role_assistant',
											value: 'assistant',
											icon: 'smart_toy',
										},
									],
								},
							},
						},
						{
							field: 'text',
							name: 'text',
							type: 'text',
							meta: {
								field: 'text',
								width: 'full',
								type: 'text',
								required: true,
								interface: 'input-rich-text-md',
								display: 'formatted-value',
								display_options: {
									format: true,
								},
								note: 'The actual content of the message. You can use {{ curly_braces }} for placeholders that will be replaced with real data.',
							},
						},
					],
					showConfirmDiscard: true,
					template: '{{ role }} • {{ text }}',
					addLabel: 'New Message',
				},
				display: 'formatted-json-value',
				display_options: {
					format: '{{ role }} • {{ text }}',
				},
				sort: 12,
				width: 'full',
				note: '$t:mcp_prompts_collection_schema.messages_note',
			},
		},
	];

	if (fields) {
		return schema.filter(({ field }) => field && fields.includes(field));
	}

	return schema;
}
