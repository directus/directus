import { getGraphQLType } from '../../../utils/get-graphql-type.js';
import type { Schema } from '../schema/index.js';
import { GraphQLBoolean, GraphQLInt, GraphQLNonNull, GraphQLString } from 'graphql';
import type {
	ObjectTypeComposerFieldConfigAsObjectDefinition,
	ObjectTypeComposerFieldConfigDefinition,
	SchemaComposer,
} from 'graphql-compose';

export function getFieldType(schemaComposer: SchemaComposer, schema: Schema, action: 'read' | 'write') {
	const prefix = action === 'read' ? '' : 'write_';

	const Field = schemaComposer.createObjectTC({
		name: `${prefix}directus_fields`,
	});

	if ('directus_fields' in schema.read.collections === false) {
		return Field;
	}

	Field.addFields({
		collection: GraphQLString,
		field: GraphQLString,
		type: GraphQLString,
		meta: schemaComposer.createObjectTC({
			name: `${prefix}directus_fields_meta`,
			fields: Object.values(schema.read.collections['directus_fields']!.fields).reduce(
				(acc, field) => {
					acc[field.field] = {
						type:
							field.nullable || action === 'write'
								? getGraphQLType(field.type, field.special)
								: new GraphQLNonNull(getGraphQLType(field.type, field.special)),
						description: field.note,
					} as ObjectTypeComposerFieldConfigDefinition<any, any, any>;

					return acc;
				},
				{} as ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>,
			),
		}),
		schema: schemaComposer.createObjectTC({
			name: `${prefix}directus_fields_schema`,
			fields: {
				name: GraphQLString,
				table: GraphQLString,
				data_type: GraphQLString,
				default_value: GraphQLString,
				max_length: GraphQLInt,
				numeric_precision: GraphQLInt,
				numeric_scale: GraphQLInt,
				is_generated: GraphQLBoolean,
				generation_expression: GraphQLString,
				is_indexed: GraphQLBoolean,
				is_nullable: GraphQLBoolean,
				is_unique: GraphQLBoolean,
				is_primary_key: GraphQLBoolean,
				has_auto_increment: GraphQLBoolean,
				foreign_key_column: GraphQLString,
				foreign_key_table: GraphQLString,
				comment: GraphQLString,
			},
		}),
	});

	return Field;
}
