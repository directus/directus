import type { GQLScope } from '@directus/types';
import type { GraphQLNullableType } from 'graphql';
import { GraphQLID, GraphQLInt, GraphQLNonNull, GraphQLScalarType, GraphQLUnionType } from 'graphql';
import type {
	ObjectTypeComposerFieldConfigAsObjectDefinition,
	ObjectTypeComposerFieldConfigDefinition,
	SchemaComposer,
} from 'graphql-compose';
import { GraphQLJSON, ObjectTypeComposer } from 'graphql-compose';
import { mapKeys, pick } from 'lodash-es';
import { GENERATE_SPECIAL } from '../../../constants.js';
import { getGraphQLType } from '../../../utils/get-graphql-type.js';
import { type InconsistentFields, type Schema, SYSTEM_DENY_LIST } from './index.js';

/**
 * Construct an object of types for every collection, using the permitted fields per action type
 * as it's fields.
 */
export function getTypes(
	schemaComposer: SchemaComposer,
	scope: GQLScope,
	schema: Schema,
	inconsistentFields: InconsistentFields,
	action: 'read' | 'create' | 'update' | 'delete',
) {
	const CollectionTypes: Record<string, ObjectTypeComposer> = {};
	const VersionTypes: Record<string, ObjectTypeComposer> = {};

	const CountFunctions = schemaComposer.createObjectTC({
		name: 'count_functions',
		fields: {
			count: {
				type: GraphQLInt,
			},
		},
	});

	const DateFunctions = schemaComposer.createObjectTC({
		name: 'date_functions',
		fields: {
			year: {
				type: GraphQLInt,
			},
			month: {
				type: GraphQLInt,
			},
			week: {
				type: GraphQLInt,
			},
			day: {
				type: GraphQLInt,
			},
			weekday: {
				type: GraphQLInt,
			},
		},
	});

	const TimeFunctions = schemaComposer.createObjectTC({
		name: 'time_functions',
		fields: {
			hour: {
				type: GraphQLInt,
			},
			minute: {
				type: GraphQLInt,
			},
			second: {
				type: GraphQLInt,
			},
		},
	});

	const DateTimeFunctions = schemaComposer.createObjectTC({
		name: 'datetime_functions',
		fields: {
			...DateFunctions.getFields(),
			...TimeFunctions.getFields(),
		},
	});

	for (const collection of Object.values(schema[action].collections)) {
		if (Object.keys(collection.fields).length === 0) continue;
		if (SYSTEM_DENY_LIST.includes(collection.collection)) continue;

		CollectionTypes[collection.collection] = schemaComposer.createObjectTC({
			name: action === 'read' ? collection.collection : `${action}_${collection.collection}`,
			fields: Object.values(collection.fields).reduce(
				(acc, field) => {
					let type: GraphQLScalarType | GraphQLNonNull<GraphQLNullableType> = getGraphQLType(field.type, field.special);

					const fieldIsInconsistent = inconsistentFields[action][collection.collection]?.includes(field.field);

					// GraphQL doesn't differentiate between not-null and has-to-be-submitted. We
					// can't non-null in update, as that would require every not-nullable field to be
					// submitted on updates
					if (
						field.nullable === false &&
						!field.defaultValue &&
						!GENERATE_SPECIAL.some((flag) => field.special.includes(flag)) &&
						fieldIsInconsistent === false &&
						action !== 'update'
					) {
						type = new GraphQLNonNull(type);
					}

					if (collection.primary === field.field && fieldIsInconsistent === false) {
						// permissions IDs need to be nullable https://github.com/directus/directus/issues/20509
						if (collection.collection === 'directus_permissions') {
							type = GraphQLID;
						} else if (!field.defaultValue && !field.special.includes('uuid') && action === 'create') {
							type = new GraphQLNonNull(GraphQLID);
						} else if (['create', 'update'].includes(action)) {
							type = GraphQLID;
						} else {
							type = new GraphQLNonNull(GraphQLID);
						}
					}

					acc[field.field] = {
						type,
						description: field.note,
						resolve: (obj: Record<string, any>) => {
							return obj[field.field];
						},
					} as ObjectTypeComposerFieldConfigDefinition<any, any>;

					if (action === 'read') {
						if (field.type === 'date') {
							acc[`${field.field}_func`] = {
								type: DateFunctions,
								resolve: (obj: Record<string, any>) => {
									const funcFields = Object.keys(DateFunctions.getFields()).map((key) => `${field.field}_${key}`);
									return mapKeys(pick(obj, funcFields), (_value, key) => key.substring(field.field.length + 1));
								},
							};
						}

						if (field.type === 'time') {
							acc[`${field.field}_func`] = {
								type: TimeFunctions,
								resolve: (obj: Record<string, any>) => {
									const funcFields = Object.keys(TimeFunctions.getFields()).map((key) => `${field.field}_${key}`);
									return mapKeys(pick(obj, funcFields), (_value, key) => key.substring(field.field.length + 1));
								},
							};
						}

						if (field.type === 'dateTime' || field.type === 'timestamp') {
							acc[`${field.field}_func`] = {
								type: DateTimeFunctions,
								resolve: (obj: Record<string, any>) => {
									const funcFields = Object.keys(DateTimeFunctions.getFields()).map((key) => `${field.field}_${key}`);

									return mapKeys(pick(obj, funcFields), (_value, key) => key.substring(field.field.length + 1));
								},
							};
						}

						if (field.type === 'json' || field.type === 'alias') {
							acc[`${field.field}_func`] = {
								type: CountFunctions,
								resolve: (obj: Record<string, any>) => {
									const funcFields = Object.keys(CountFunctions.getFields()).map((key) => `${field.field}_${key}`);
									return mapKeys(pick(obj, funcFields), (_value, key) => key.substring(field.field.length + 1));
								},
							};
						}
					}

					return acc;
				},
				{} as ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>,
			),
		});

		if (scope === 'items') {
			VersionTypes[collection.collection] = CollectionTypes[collection.collection]!.clone(
				`version_${collection.collection}`,
			);
		}
	}

	for (const relation of schema[action].relations) {
		if (relation.related_collection) {
			if (SYSTEM_DENY_LIST.includes(relation.related_collection)) continue;

			CollectionTypes[relation.collection]?.addFields({
				[relation.field]: {
					type: CollectionTypes[relation.related_collection]!,
					resolve: (obj: Record<string, any>, _, __, info) => {
						return obj[info?.path?.key ?? relation.field];
					},
				},
			});

			VersionTypes[relation.collection]?.addFields({
				[relation.field]: {
					type: GraphQLJSON,
					resolve: (obj: Record<string, any>, _, __, info) => {
						return obj[info?.path?.key ?? relation.field];
					},
				},
			});

			if (relation.meta?.one_field) {
				CollectionTypes[relation.related_collection]?.addFields({
					[relation.meta.one_field]: {
						type: [CollectionTypes[relation.collection]!],
						resolve: (obj: Record<string, any>, _, __, info) => {
							return obj[info?.path?.key ?? relation.meta!.one_field];
						},
					},
				});

				if (scope === 'items') {
					VersionTypes[relation.related_collection]?.addFields({
						[relation.meta.one_field]: {
							type: GraphQLJSON,
							resolve: (obj: Record<string, any>, _, __, info) => {
								return obj[info?.path?.key ?? relation.meta!.one_field];
							},
						},
					});
				}
			}
		} else if (relation.meta?.one_allowed_collections && action === 'read') {
			// NOTE: There are no union input types in GraphQL, so context only applies to Read actions
			CollectionTypes[relation.collection]?.addFields({
				[relation.field]: {
					type: new GraphQLUnionType({
						name: `${relation.collection}_${relation.field}_union`,
						types: relation.meta.one_allowed_collections.map((collection) => CollectionTypes[collection]!.getType()),
						resolveType(_value, context, info) {
							let path: (string | number)[] = [];
							let currentPath = info.path;

							while (currentPath.prev) {
								path.push(currentPath.key);
								currentPath = currentPath.prev;
							}

							path = path.reverse().slice(0, -1);

							let parent = context['data']!;

							for (const pathPart of path) {
								parent = parent[pathPart];
							}

							const collection = parent[relation.meta!.one_collection_field!]!;
							return CollectionTypes[collection]!.getType().name;
						},
					}),
					resolve: (obj: Record<string, any>, _, __, info) => {
						return obj[info?.path?.key ?? relation.field];
					},
				},
			});
		}
	}

	return { CollectionTypes, VersionTypes };
}
