import type { CoreCollection } from "../index.js";

export type DirectusField<Schema extends object> = {
    collection: string;
    field: string;
    type: string;
    meta: CoreCollection<Schema, 'directus_fields', {
        collection: string;
        conditions: FieldMetaConditionType[] | null;
        display: string | null;
        display_options: string | null;
        field: string;
        group: string | null;
        hidden: boolean;
        id: number;
        interface: string;
        note: string | null;
        // TODO: options vary by field type
        options: Record<string, any> | null;
        readonly: boolean;
        required: boolean;
        sort: number | null;
        special: string[] | null;
        translations: FieldMetaTranslationType[] | null;
        validation: Record<string, any> | null;
        validation_message: string | null;
        width: string;
    }>;
    schema: {
        name: string;
        table: string;
        schema: string;
        data_type: string;
        is_nullable: boolean;
        generation_expression: unknown | null;
        default_value: any | null;
        is_generated: boolean;
        max_length: number | null;
        comment: string | null;
        numeric_precision: number | null;
        numeric_scale: number | null;
        is_unique: boolean;
        is_primary_key: boolean;
        has_auto_increment: boolean;
        foreign_key_schema: string | null;
        foreign_key_table: string | null;
        foreign_key_column: string | null;
    };
};

export type FieldMetaConditionType = {
	// TODO: review
	hidden: boolean;
	name: string;
	options: FieldMetaConditionOptionType;
	readonly: boolean;
	required: boolean;
	// TODO: rules use atomic operators and can nest
	rule: unknown;
};

export type FieldMetaConditionOptionType = {
	// TODO: review
	clear: boolean;
	font: string;
	iconLeft?: string;
	iconRight?: string;
	masked: boolean;
	placeholder: string;
	slug: boolean;
	softLength?: number;
	trim: boolean;
};

export type FieldMetaTranslationType = {
	language: string;
	translation: string;
};
