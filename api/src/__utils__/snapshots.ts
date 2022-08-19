import { Snapshot, SnapshotField, SnapshotRelation } from '../types';

export const snapshotBeforeCreateCollection: Snapshot = {
	version: 1,
	directus: '0.0.0',
	collections: [
		{
			collection: 'test_table',
			meta: {
				accountability: 'all',
				collection: 'test_table',
				group: null,
				hidden: true,
				icon: 'import_export',
				item_duplication_fields: null,
				note: null,
				singleton: false,
				translations: {},
			},
			schema: {
				comment: null,
				name: 'test_table',
				schema: 'public',
			},
		},
	],
	fields: [
		{
			collection: 'test_table',
			field: 'id',
			meta: {
				collection: 'test_table',
				conditions: null,
				display: null,
				display_options: null,
				field: 'id',
				group: null,
				hidden: true,
				interface: null,
				note: null,
				options: null,
				readonly: false,
				required: false,
				sort: null,
				special: null,
				translations: {},
				validation: null,
				validation_message: null,
				width: 'full',
			},
			schema: {
				comment: null,
				data_type: 'uuid',
				default_value: null,
				foreign_key_column: null,
				foreign_key_schema: null,
				foreign_key_table: null,
				generation_expression: null,
				has_auto_increment: false,
				is_generated: false,
				is_nullable: false,
				is_primary_key: true,
				is_unique: true,
				max_length: null,
				name: 'id',
				numeric_precision: null,
				numeric_scale: null,
				schema: 'public',
				table: 'test_table',
			},
			type: 'uuid',
		} as SnapshotField,
	],
	relations: [],
};

export const snapshotCreateCollection: Snapshot = {
	version: 1,
	directus: '0.0.0',
	collections: [
		{
			collection: 'test_table',
			meta: {
				accountability: 'all',
				collection: 'test_table',
				group: null,
				hidden: true,
				icon: 'import_export',
				item_duplication_fields: null,
				note: null,
				singleton: false,
				translations: {},
			},
			schema: {
				comment: null,
				name: 'test_table',
				schema: 'public',
			},
		},
		{
			collection: 'test_table_2',
			meta: {
				accountability: 'all',
				collection: 'test_table_2',
				group: 'test_table',
				hidden: true,
				icon: 'import_export',
				item_duplication_fields: null,
				note: null,
				singleton: false,
				translations: {},
			},
			schema: {
				comment: null,
				name: 'test_table_2',
				schema: 'public',
			},
		},
		{
			collection: 'test_table_3',
			meta: {
				accountability: 'all',
				collection: 'test_table_3',
				group: 'test_table_2',
				hidden: true,
				icon: 'import_export',
				item_duplication_fields: null,
				note: null,
				singleton: false,
				translations: {},
			},
			schema: {
				comment: null,
				name: 'test_table_3',
				schema: 'public',
			},
		},
	],
	fields: [
		{
			collection: 'test_table',
			field: 'id',
			meta: {
				collection: 'test_table',
				conditions: null,
				display: null,
				display_options: null,
				field: 'id',
				group: null,
				hidden: true,
				interface: null,
				note: null,
				options: null,
				readonly: false,
				required: false,
				sort: null,
				special: null,
				translations: {},
				validation: null,
				validation_message: null,
				width: 'full',
			},
			schema: {
				comment: null,
				data_type: 'uuid',
				default_value: null,
				foreign_key_column: null,
				foreign_key_schema: null,
				foreign_key_table: null,
				generation_expression: null,
				has_auto_increment: false,
				is_generated: false,
				is_nullable: false,
				is_primary_key: true,
				is_unique: true,
				max_length: null,
				name: 'id',
				numeric_precision: null,
				numeric_scale: null,
				schema: 'public',
				table: 'test_table',
			},
			type: 'uuid',
		} as SnapshotField,
		{
			collection: 'test_table_2',
			field: 'id',
			meta: {
				collection: 'test_table_2',
				conditions: null,
				display: null,
				display_options: null,
				field: 'id',
				group: null,
				hidden: true,
				interface: null,
				note: null,
				options: null,
				readonly: false,
				required: false,
				sort: null,
				special: null,
				translations: {},
				validation: null,
				validation_message: null,
				width: 'full',
			},
			schema: {
				comment: null,
				data_type: 'uuid',
				default_value: null,
				foreign_key_column: null,
				foreign_key_schema: null,
				foreign_key_table: null,
				generation_expression: null,
				has_auto_increment: false,
				is_generated: false,
				is_nullable: false,
				is_primary_key: true,
				is_unique: true,
				max_length: null,
				name: 'id',
				numeric_precision: null,
				numeric_scale: null,
				schema: 'public',
				table: 'test_table_2',
			},
			type: 'uuid',
		} as SnapshotField,
		{
			collection: 'test_table_3',
			field: 'id',
			meta: {
				collection: 'test_table_3',
				conditions: null,
				display: null,
				display_options: null,
				field: 'id',
				group: null,
				hidden: true,
				interface: null,
				note: null,
				options: null,
				readonly: false,
				required: false,
				sort: null,
				special: null,
				translations: {},
				validation: null,
				validation_message: null,
				width: 'full',
			},
			schema: {
				comment: null,
				data_type: 'uuid',
				default_value: null,
				foreign_key_column: null,
				foreign_key_schema: null,
				foreign_key_table: null,
				generation_expression: null,
				has_auto_increment: false,
				is_generated: false,
				is_nullable: false,
				is_primary_key: true,
				is_unique: true,
				max_length: null,
				name: 'id',
				numeric_precision: null,
				numeric_scale: null,
				schema: 'public',
				table: 'test_table_3',
			},
			type: 'uuid',
		} as SnapshotField,
	],
	relations: [],
};

export const snapshotCreateCollectionNotNested: Snapshot = {
	version: 1,
	directus: '0.0.0',
	collections: [
		{
			collection: 'test_table',
			meta: {
				accountability: 'all',
				collection: 'test_table',
				group: null,
				hidden: true,
				icon: 'import_export',
				item_duplication_fields: null,
				note: null,
				singleton: false,
				translations: {},
			},
			schema: {
				comment: null,
				name: 'test_table',
				schema: 'public',
			},
		},
		{
			collection: 'test_table_2',
			meta: {
				accountability: 'all',
				collection: 'test_table_2',
				group: null,
				hidden: true,
				icon: 'import_export',
				item_duplication_fields: null,
				note: null,
				singleton: false,
				translations: {},
			},
			schema: {
				comment: null,
				name: 'test_table_2',
				schema: 'public',
			},
		},
	],
	fields: [
		{
			collection: 'test_table',
			field: 'id',
			meta: {
				collection: 'test_table',
				conditions: null,
				display: null,
				display_options: null,
				field: 'id',
				group: null,
				hidden: true,
				interface: null,
				note: null,
				options: null,
				readonly: false,
				required: false,
				sort: null,
				special: null,
				translations: {},
				validation: null,
				validation_message: null,
				width: 'full',
			},
			schema: {
				comment: null,
				data_type: 'uuid',
				default_value: null,
				foreign_key_column: null,
				foreign_key_schema: null,
				foreign_key_table: null,
				generation_expression: null,
				has_auto_increment: false,
				is_generated: false,
				is_nullable: false,
				is_primary_key: true,
				is_unique: true,
				max_length: null,
				name: 'id',
				numeric_precision: null,
				numeric_scale: null,
				schema: 'public',
				table: 'test_table',
			},
			type: 'uuid',
		} as SnapshotField,
		{
			collection: 'test_table_2',
			field: 'id',
			meta: {
				collection: 'test_table_2',
				conditions: null,
				display: null,
				display_options: null,
				field: 'id',
				group: null,
				hidden: true,
				interface: null,
				note: null,
				options: null,
				readonly: false,
				required: false,
				sort: null,
				special: null,
				translations: {},
				validation: null,
				validation_message: null,
				width: 'full',
			},
			schema: {
				comment: null,
				data_type: 'uuid',
				default_value: null,
				foreign_key_column: null,
				foreign_key_schema: null,
				foreign_key_table: null,
				generation_expression: null,
				has_auto_increment: false,
				is_generated: false,
				is_nullable: false,
				is_primary_key: true,
				is_unique: true,
				max_length: null,
				name: 'id',
				numeric_precision: null,
				numeric_scale: null,
				schema: 'public',
				table: 'test_table_2',
			},
			type: 'uuid',
		} as SnapshotField,
	],
	relations: [],
};

export const snapshotBeforeDeleteCollection: Snapshot = {
	version: 1,
	directus: '0.0.0',
	collections: [
		{
			collection: 'articles',
			meta: {
				accountability: 'all',
				collection: 'articles',
				group: null,
				hidden: false,
				icon: null,
				item_duplication_fields: null,
				note: null,
				singleton: false,
				translations: {},
			},
			schema: {
				comment: null,
				name: 'articles',
				schema: 'public',
			},
		},
		{
			collection: 'articles_translations',
			meta: {
				accountability: 'all',
				collection: 'articles_translations',
				group: null,
				hidden: true,
				icon: 'import_export',
				item_duplication_fields: null,
				note: null,
				singleton: false,
				translations: {},
			},
			schema: {
				comment: null,
				name: 'articles_translations',
				schema: 'public',
			},
		},
		{
			collection: 'languages',
			meta: {
				accountability: 'all',
				collection: 'languages',
				group: null,
				hidden: false,
				icon: null,
				item_duplication_fields: null,
				note: null,
				singleton: false,
				translations: {},
			},
			schema: {
				comment: null,
				name: 'languages',
				schema: 'public',
			},
		},
	],
	fields: [
		{
			collection: 'articles',
			field: 'id',
			meta: {
				collection: 'articles',
				conditions: null,
				display: null,
				display_options: null,
				field: 'id',
				group: null,
				hidden: true,
				interface: 'input',
				note: null,
				options: null,
				readonly: true,
				required: false,
				sort: null,
				special: null,
				translations: [],
				validation: null,
				validation_message: null,
				width: 'full',
			},
			schema: {
				comment: null,
				data_type: 'integer',
				default_value: "nextval('articles_id_seq'::regclass)",
				foreign_key_column: null,
				foreign_key_schema: null,
				foreign_key_table: null,
				generation_expression: null,
				has_auto_increment: true,
				is_generated: false,
				is_nullable: false,
				is_primary_key: true,
				is_unique: true,
				max_length: null,
				name: 'id',
				numeric_precision: 32,
				numeric_scale: 0,
				schema: 'public',
				table: 'articles',
			},
			type: 'integer',
		},
		{
			collection: 'articles',
			field: 'translations',
			meta: {
				collection: 'articles',
				conditions: null,
				display: null,
				display_options: null,
				field: 'translations',
				group: null,
				hidden: false,
				interface: 'translations',
				note: null,
				options: null,
				readonly: false,
				required: false,
				sort: null,
				special: ['translations'],
				translations: [],
				validation: null,
				validation_message: null,
				width: 'full',
			},
			schema: null,
			type: 'alias',
		},
		{
			collection: 'articles_translations',
			field: 'articles_id',
			meta: {
				collection: 'articles_translations',
				conditions: null,
				display: null,
				display_options: null,
				field: 'articles_id',
				group: null,
				hidden: true,
				interface: null,
				note: null,
				options: null,
				readonly: false,
				required: false,
				sort: null,
				special: null,
				translations: [],
				validation: null,
				validation_message: null,
				width: 'full',
			},
			schema: {
				comment: null,
				data_type: 'integer',
				default_value: null,
				foreign_key_column: 'id',
				foreign_key_schema: 'public',
				foreign_key_table: 'articles',
				generation_expression: null,
				has_auto_increment: false,
				is_generated: false,
				is_nullable: true,
				is_primary_key: false,
				is_unique: false,
				max_length: null,
				name: 'articles_id',
				numeric_precision: 32,
				numeric_scale: 0,
				schema: 'public',
				table: 'articles_translations',
			},
			type: 'integer',
		},
		{
			collection: 'articles_translations',
			field: 'id',
			meta: {
				collection: 'articles_translations',
				conditions: null,
				display: null,
				display_options: null,
				field: 'id',
				group: null,
				hidden: true,
				interface: null,
				note: null,
				options: null,
				readonly: false,
				required: false,
				sort: null,
				special: null,
				translations: [],
				validation: null,
				validation_message: null,
				width: 'full',
			},
			schema: {
				comment: null,
				data_type: 'integer',
				default_value: "nextval('articles_translations_id_seq'::regclass)",
				foreign_key_column: null,
				foreign_key_schema: null,
				foreign_key_table: null,
				generation_expression: null,
				has_auto_increment: true,
				is_generated: false,
				is_nullable: false,
				is_primary_key: true,
				is_unique: true,
				max_length: null,
				name: 'id',
				numeric_precision: 32,
				numeric_scale: 0,
				schema: 'public',
				table: 'articles_translations',
			},
			type: 'integer',
		},
		{
			collection: 'articles_translations',
			field: 'languages_id',
			meta: {
				collection: 'articles_translations',
				conditions: null,
				display: null,
				display_options: null,
				field: 'languages_id',
				group: null,
				hidden: true,
				interface: null,
				note: null,
				options: null,
				readonly: false,
				required: false,
				sort: null,
				special: null,
				translations: [],
				validation: null,
				validation_message: null,
				width: 'full',
			},
			schema: {
				comment: null,
				data_type: 'character varying',
				default_value: null,
				foreign_key_column: 'code',
				foreign_key_schema: 'public',
				foreign_key_table: 'languages',
				generation_expression: null,
				has_auto_increment: false,
				is_generated: false,
				is_nullable: true,
				is_primary_key: false,
				is_unique: false,
				max_length: 255,
				name: 'languages_id',
				numeric_precision: null,
				numeric_scale: null,
				schema: 'public',
				table: 'articles_translations',
			},
			type: 'string',
		},
		{
			collection: 'languages',
			field: 'code',
			meta: {
				collection: 'languages',
				conditions: null,
				display: null,
				display_options: null,
				field: 'code',
				group: null,
				hidden: false,
				interface: null,
				note: null,
				options: null,
				readonly: false,
				required: false,
				sort: null,
				special: null,
				translations: [],
				validation: null,
				validation_message: null,
				width: 'full',
			},
			schema: {
				comment: null,
				data_type: 'character varying',
				default_value: null,
				foreign_key_column: null,
				foreign_key_schema: null,
				foreign_key_table: null,
				generation_expression: null,
				has_auto_increment: false,
				is_generated: false,
				is_nullable: false,
				is_primary_key: true,
				is_unique: true,
				max_length: 255,
				name: 'code',
				numeric_precision: null,
				numeric_scale: null,
				schema: 'public',
				table: 'languages',
			},
			type: 'string',
		},
		{
			collection: 'languages',
			field: 'direction',
			meta: {
				collection: 'languages',
				conditions: null,
				display: 'labels',
				display_options: {
					choices: [
						{
							text: '$t:left_to_right',
							value: 'ltr',
						},
						{
							text: '$t:right_to_left',
							value: 'rtl',
						},
					],
					format: false,
				},
				field: 'direction',
				group: null,
				hidden: false,
				interface: 'select-dropdown',
				note: null,
				options: {
					choices: [
						{
							text: '$t:left_to_right',
							value: 'ltr',
						},
						{
							text: '$t:right_to_left',
							value: 'rtl',
						},
					],
				},
				readonly: false,
				required: false,
				sort: null,
				special: null,
				translations: [],
				validation: null,
				validation_message: null,
				width: 'full',
			},
			schema: {
				comment: null,
				data_type: 'character varying',
				default_value: 'ltr',
				foreign_key_column: null,
				foreign_key_schema: null,
				foreign_key_table: null,
				generation_expression: null,
				has_auto_increment: false,
				is_generated: false,
				is_nullable: true,
				is_primary_key: false,
				is_unique: false,
				max_length: 255,
				name: 'direction',
				numeric_precision: null,
				numeric_scale: null,
				schema: 'public',
				table: 'languages',
			},
			type: 'string',
		},
		{
			collection: 'languages',
			field: 'name',
			meta: {
				collection: 'languages',
				conditions: null,
				display: null,
				display_options: null,
				field: 'name',
				group: null,
				hidden: false,
				interface: null,
				note: null,
				options: null,
				readonly: false,
				required: false,
				sort: null,
				special: null,
				translations: [],
				validation: null,
				validation_message: null,
				width: 'full',
			},
			schema: {
				comment: null,
				data_type: 'character varying',
				default_value: null,
				foreign_key_column: null,
				foreign_key_schema: null,
				foreign_key_table: null,
				generation_expression: null,
				has_auto_increment: false,
				is_generated: false,
				is_nullable: true,
				is_primary_key: false,
				is_unique: false,
				max_length: 255,
				name: 'name',
				numeric_precision: null,
				numeric_scale: null,
				schema: 'public',
				table: 'languages',
			},
			type: 'string',
		},
	] as unknown as SnapshotField[],
	relations: [
		{
			collection: 'articles_translations',
			field: 'articles_id',
			meta: {
				junction_field: 'languages_id',
				many_collection: 'articles_translations',
				many_field: 'articles_id',
				one_allowed_collections: null,
				one_collection: 'articles',
				one_collection_field: null,
				one_deselect_action: 'nullify',
				one_field: 'translations',
				sort_field: null,
			},
			related_collection: 'articles',
			schema: {
				column: 'articles_id',
				constraint_name: 'articles_translations_articles_id_foreign',
				foreign_key_column: 'id',
				foreign_key_schema: 'public',
				foreign_key_table: 'articles',
				on_delete: 'SET NULL',
				on_update: 'NO ACTION',
				table: 'articles_translations',
			},
		},
		{
			collection: 'articles_translations',
			field: 'languages_id',
			meta: {
				junction_field: 'articles_id',
				many_collection: 'articles_translations',
				many_field: 'languages_id',
				one_allowed_collections: null,
				one_collection: 'languages',
				one_collection_field: null,
				one_deselect_action: 'nullify',
				one_field: null,
				sort_field: null,
			},
			related_collection: 'languages',
			schema: {
				column: 'languages_id',
				constraint_name: 'articles_translations_languages_id_foreign',
				foreign_key_column: 'code',
				foreign_key_schema: 'public',
				foreign_key_table: 'languages',
				on_delete: 'SET NULL',
				on_update: 'NO ACTION',
				table: 'articles_translations',
			},
		},
	] as SnapshotRelation[],
};
