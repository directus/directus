import type { CollectionName, FilterOperators, MergeCoreCollection, WrapLogicalFilters } from '../index.js';

export type DirectusField<Schema = any> = {
	collection: CollectionName<Schema>;
	field: string;
	type: string;
	meta: MergeCoreCollection<
		Schema,
		'directus_fields',
		{
			id: number;
			collection: CollectionName<Schema>;
			field: string;
			special: string[] | null;
			interface: string | null;
			options: Record<string, any> | null;
			display: string | null;
			display_options: Record<string, any> | null;
			readonly: boolean;
			hidden: boolean;
			sort: number | null;
			width: string | null;
			translations: FieldMetaTranslationType[] | null;
			note: string | null;
			conditions: FieldMetaConditionType[] | null;
			required: boolean;
			searchable: boolean;
			group: string | null;
			validation: Record<string, any> | null;
			validation_message: string | null;
			system?: true;
			clear_hidden_value_on_save?: boolean;
		}
	>;
	schema: {
		name: string;
		table: CollectionName<Schema>;
		schema?: string;
		data_type: string;
		is_nullable: boolean;
		default_value: any | null;
		is_indexed: boolean;
		is_generated: boolean;
		generation_expression?: string | null;
		max_length: number | null;
		comment?: string | null;
		numeric_precision: number | null;
		numeric_scale: number | null;
		is_unique: boolean;
		is_primary_key: boolean;
		has_auto_increment: boolean;
		foreign_key_schema?: string | null;
		foreign_key_table: string | null;
		foreign_key_column: string | null;
	} | null;
};

export type FieldMetaConditionType = {
	name: string;
	hidden?: boolean;
	readonly?: boolean;
	required?: boolean;
	clear_hidden_value_on_save?: boolean;
	options?: Record<string, any>;
	rule: FieldMetaConditionRule;
};

export type FieldMetaConditionRule = WrapLogicalFilters<Record<string, FilterOperators<any>>>;

export type FieldMetaTranslationType = {
	language: string;
	translation: string;
};
