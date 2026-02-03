import type { GraphQLResolveInfo } from 'graphql';
import {
	GraphQLBoolean,
	GraphQLFloat,
	GraphQLID,
	GraphQLInt,
	GraphQLList,
	GraphQLNonNull,
	GraphQLString,
} from 'graphql';
import type {
	InputTypeComposerFieldConfigMapDefinition,
	ObjectTypeComposerFieldConfigAsObjectDefinition,
	ObjectTypeComposerFieldConfigMapDefinition,
	ResolverDefinition,
	SchemaComposer,
} from 'graphql-compose';
import { GraphQLJSON, InputTypeComposer, ObjectTypeComposer } from 'graphql-compose';
import { getGraphQLType } from '../../../utils/get-graphql-type.js';
import { GraphQLService } from '../index.js';
import { resolveQuery } from '../resolvers/query.js';
import { createSubscriptionGenerator } from '../subscription.js';
import { GraphQLBigInt } from '../types/bigint.js';
import { GraphQLDate } from '../types/date.js';
import { GraphQLGeoJSON } from '../types/geojson.js';
import { GraphQLHash } from '../types/hash.js';
import { GraphQLStringOrFloat } from '../types/string-or-float.js';
import { getTypes } from './get-types.js';
import { type InconsistentFields, type Schema, SYSTEM_DENY_LIST } from './index.js';

/**
 * Create readable types and attach resolvers for each. Also prepares full filter argument structures
 */
export async function getReadableTypes(
	gql: GraphQLService,
	schemaComposer: SchemaComposer,
	schema: Schema,
	inconsistentFields: InconsistentFields,
) {
	const { CollectionTypes: ReadCollectionTypes, VersionTypes: VersionCollectionTypes } = getTypes(
		schemaComposer,
		gql.scope,
		schema,
		inconsistentFields,
		'read',
	);

	const ReadableCollectionFilterTypes: Record<string, InputTypeComposer> = {};
	const ReadableCollectionQuantifierFilterTypes: Record<string, InputTypeComposer> = {};

	const AggregatedFunctions: Record<string, ObjectTypeComposer<any, any>> = {};
	const AggregatedFields: Record<string, ObjectTypeComposer<any, any>> = {};
	const AggregateMethods: Record<string, ObjectTypeComposerFieldConfigMapDefinition<any, any>> = {};

	const IDFilterOperators = schemaComposer.createInputTC({
		name: 'id_filter_operators',
		fields: {
			_eq: {
				type: GraphQLID,
			},
			_neq: {
				type: GraphQLID,
			},
			_contains: {
				type: GraphQLID,
			},
			_icontains: {
				type: GraphQLID,
			},
			_ncontains: {
				type: GraphQLID,
			},
			_starts_with: {
				type: GraphQLID,
			},
			_nstarts_with: {
				type: GraphQLID,
			},
			_istarts_with: {
				type: GraphQLID,
			},
			_nistarts_with: {
				type: GraphQLID,
			},
			_ends_with: {
				type: GraphQLID,
			},
			_nends_with: {
				type: GraphQLID,
			},
			_iends_with: {
				type: GraphQLID,
			},
			_niends_with: {
				type: GraphQLID,
			},
			_in: {
				type: new GraphQLList(GraphQLID),
			},
			_nin: {
				type: new GraphQLList(GraphQLID),
			},
			_null: {
				type: GraphQLBoolean,
			},
			_nnull: {
				type: GraphQLBoolean,
			},
			_empty: {
				type: GraphQLBoolean,
			},
			_nempty: {
				type: GraphQLBoolean,
			},
		},
	});

	const StringFilterOperators = schemaComposer.createInputTC({
		name: 'string_filter_operators',
		fields: {
			_eq: {
				type: GraphQLString,
			},
			_neq: {
				type: GraphQLString,
			},
			_contains: {
				type: GraphQLString,
			},
			_icontains: {
				type: GraphQLString,
			},
			_ncontains: {
				type: GraphQLString,
			},
			_starts_with: {
				type: GraphQLString,
			},
			_nstarts_with: {
				type: GraphQLString,
			},
			_istarts_with: {
				type: GraphQLString,
			},
			_nistarts_with: {
				type: GraphQLString,
			},
			_ends_with: {
				type: GraphQLString,
			},
			_nends_with: {
				type: GraphQLString,
			},
			_iends_with: {
				type: GraphQLString,
			},
			_niends_with: {
				type: GraphQLString,
			},
			_in: {
				type: new GraphQLList(GraphQLString),
			},
			_nin: {
				type: new GraphQLList(GraphQLString),
			},
			_null: {
				type: GraphQLBoolean,
			},
			_nnull: {
				type: GraphQLBoolean,
			},
			_empty: {
				type: GraphQLBoolean,
			},
			_nempty: {
				type: GraphQLBoolean,
			},
		},
	});

	const BooleanFilterOperators = schemaComposer.createInputTC({
		name: 'boolean_filter_operators',
		fields: {
			_eq: {
				type: GraphQLBoolean,
			},
			_neq: {
				type: GraphQLBoolean,
			},
			_null: {
				type: GraphQLBoolean,
			},
			_nnull: {
				type: GraphQLBoolean,
			},
		},
	});

	const DateFilterOperators = schemaComposer.createInputTC({
		name: 'date_filter_operators',
		fields: {
			_eq: {
				type: GraphQLString,
			},
			_neq: {
				type: GraphQLString,
			},
			_gt: {
				type: GraphQLString,
			},
			_gte: {
				type: GraphQLString,
			},
			_lt: {
				type: GraphQLString,
			},
			_lte: {
				type: GraphQLString,
			},
			_null: {
				type: GraphQLBoolean,
			},
			_nnull: {
				type: GraphQLBoolean,
			},
			_in: {
				type: new GraphQLList(GraphQLString),
			},
			_nin: {
				type: new GraphQLList(GraphQLString),
			},
			_between: {
				type: new GraphQLList(GraphQLStringOrFloat),
			},
			_nbetween: {
				type: new GraphQLList(GraphQLStringOrFloat),
			},
		},
	});

	// Uses StringOrFloat rather than Float to support api dynamic variables (like `$NOW`)
	const NumberFilterOperators = schemaComposer.createInputTC({
		name: 'number_filter_operators',
		fields: {
			_eq: {
				type: GraphQLStringOrFloat,
			},
			_neq: {
				type: GraphQLStringOrFloat,
			},
			_in: {
				type: new GraphQLList(GraphQLStringOrFloat),
			},
			_nin: {
				type: new GraphQLList(GraphQLStringOrFloat),
			},
			_gt: {
				type: GraphQLStringOrFloat,
			},
			_gte: {
				type: GraphQLStringOrFloat,
			},
			_lt: {
				type: GraphQLStringOrFloat,
			},
			_lte: {
				type: GraphQLStringOrFloat,
			},
			_null: {
				type: GraphQLBoolean,
			},
			_nnull: {
				type: GraphQLBoolean,
			},
			_between: {
				type: new GraphQLList(GraphQLStringOrFloat),
			},
			_nbetween: {
				type: new GraphQLList(GraphQLStringOrFloat),
			},
		},
	});

	const BigIntFilterOperators = schemaComposer.createInputTC({
		name: 'big_int_filter_operators',
		fields: {
			_eq: {
				type: GraphQLBigInt,
			},
			_neq: {
				type: GraphQLBigInt,
			},
			_in: {
				type: new GraphQLList(GraphQLBigInt),
			},
			_nin: {
				type: new GraphQLList(GraphQLBigInt),
			},
			_gt: {
				type: GraphQLBigInt,
			},
			_gte: {
				type: GraphQLBigInt,
			},
			_lt: {
				type: GraphQLBigInt,
			},
			_lte: {
				type: GraphQLBigInt,
			},
			_null: {
				type: GraphQLBoolean,
			},
			_nnull: {
				type: GraphQLBoolean,
			},
			_between: {
				type: new GraphQLList(GraphQLBigInt),
			},
			_nbetween: {
				type: new GraphQLList(GraphQLBigInt),
			},
		},
	});

	const GeometryFilterOperators = schemaComposer.createInputTC({
		name: 'geometry_filter_operators',
		fields: {
			_eq: {
				type: GraphQLGeoJSON,
			},
			_neq: {
				type: GraphQLGeoJSON,
			},
			_intersects: {
				type: GraphQLGeoJSON,
			},
			_nintersects: {
				type: GraphQLGeoJSON,
			},
			_intersects_bbox: {
				type: GraphQLGeoJSON,
			},
			_nintersects_bbox: {
				type: GraphQLGeoJSON,
			},
			_null: {
				type: GraphQLBoolean,
			},
			_nnull: {
				type: GraphQLBoolean,
			},
		},
	});

	const HashFilterOperators = schemaComposer.createInputTC({
		name: 'hash_filter_operators',
		fields: {
			_null: {
				type: GraphQLBoolean,
			},
			_nnull: {
				type: GraphQLBoolean,
			},
			_empty: {
				type: GraphQLBoolean,
			},
			_nempty: {
				type: GraphQLBoolean,
			},
		},
	});

	const CountFunctionFilterOperators = schemaComposer.createInputTC({
		name: 'count_function_filter_operators',
		fields: {
			count: {
				type: NumberFilterOperators,
			},
		},
	});

	const DateFunctionFilterOperators = schemaComposer.createInputTC({
		name: 'date_function_filter_operators',
		fields: {
			year: {
				type: NumberFilterOperators,
			},
			month: {
				type: NumberFilterOperators,
			},
			week: {
				type: NumberFilterOperators,
			},
			day: {
				type: NumberFilterOperators,
			},
			weekday: {
				type: NumberFilterOperators,
			},
		},
	});

	const TimeFunctionFilterOperators = schemaComposer.createInputTC({
		name: 'time_function_filter_operators',
		fields: {
			hour: {
				type: NumberFilterOperators,
			},
			minute: {
				type: NumberFilterOperators,
			},
			second: {
				type: NumberFilterOperators,
			},
		},
	});

	const DateTimeFunctionFilterOperators = schemaComposer.createInputTC({
		name: 'datetime_function_filter_operators',
		fields: {
			...DateFunctionFilterOperators.getFields(),
			...TimeFunctionFilterOperators.getFields(),
		},
	});

	const subscriptionEventType = schemaComposer.createEnumTC({
		name: 'EventEnum',
		values: {
			create: { value: 'create' },
			update: { value: 'update' },
			delete: { value: 'delete' },
		},
	});

	for (const collection of Object.values(schema.read.collections)) {
		if (Object.keys(collection.fields).length === 0) continue;
		if (SYSTEM_DENY_LIST.includes(collection.collection)) continue;

		ReadableCollectionFilterTypes[collection.collection] = schemaComposer.createInputTC({
			name: `${collection.collection}_filter`,
			fields: Object.values(collection.fields).reduce((acc, field) => {
				const graphqlType = getGraphQLType(field.type, field.special);

				let filterOperatorType: InputTypeComposer;

				switch (graphqlType) {
					case GraphQLBoolean:
						filterOperatorType = BooleanFilterOperators;
						break;
					case GraphQLBigInt:
						filterOperatorType = BigIntFilterOperators;
						break;
					case GraphQLInt:
					case GraphQLFloat:
						filterOperatorType = NumberFilterOperators;
						break;
					case GraphQLDate:
						filterOperatorType = DateFilterOperators;
						break;
					case GraphQLGeoJSON:
						filterOperatorType = GeometryFilterOperators;
						break;
					case GraphQLHash:
						filterOperatorType = HashFilterOperators;
						break;
					case GraphQLID:
						filterOperatorType = IDFilterOperators;
						break;
					default:
						filterOperatorType = StringFilterOperators;
				}

				acc[field.field] = filterOperatorType;

				if (field.type === 'date') {
					acc[`${field.field}_func`] = {
						type: DateFunctionFilterOperators,
					};
				}

				if (field.type === 'time') {
					acc[`${field.field}_func`] = {
						type: TimeFunctionFilterOperators,
					};
				}

				if (field.type === 'dateTime' || field.type === 'timestamp') {
					acc[`${field.field}_func`] = {
						type: DateTimeFunctionFilterOperators,
					};
				}

				if (field.type === 'json' || field.type === 'alias') {
					acc[`${field.field}_func`] = {
						type: CountFunctionFilterOperators,
					};
				}

				return acc;
			}, {} as InputTypeComposerFieldConfigMapDefinition),
		});

		ReadableCollectionFilterTypes[collection.collection]!.addFields({
			_and: [ReadableCollectionFilterTypes[collection.collection]!],
			_or: [ReadableCollectionFilterTypes[collection.collection]!],
		});

		AggregatedFields[collection.collection] = schemaComposer.createObjectTC({
			name: `${collection.collection}_aggregated_fields`,
			fields: Object.values(collection.fields).reduce(
				(acc, field) => {
					const graphqlType = getGraphQLType(field.type, field.special);

					switch (graphqlType) {
						case GraphQLBigInt:
						case GraphQLInt:
						case GraphQLFloat:
							acc[field.field] = {
								type: GraphQLFloat,
								description: field.note,
							};

							break;
						default:
							break;
					}

					return acc;
				},
				{} as ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>,
			),
		});

		const countType = schemaComposer.createObjectTC({
			name: `${collection.collection}_aggregated_count`,
			fields: Object.values(collection.fields).reduce(
				(acc, field) => {
					acc[field.field] = {
						type: GraphQLInt,
						description: field.note,
					};

					return acc;
				},
				{} as ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>,
			),
		});

		AggregateMethods[collection.collection] = {
			group: {
				name: 'group',
				type: GraphQLJSON,
			},
			countAll: {
				name: 'countAll',
				type: GraphQLInt,
			},
			count: {
				name: 'count',
				type: countType,
			},
			countDistinct: {
				name: 'countDistinct',
				type: countType,
			},
		};

		const hasNumericAggregates = Object.values(collection.fields).some((field) => {
			const graphqlType = getGraphQLType(field.type, field.special);

			if (graphqlType === GraphQLInt || graphqlType === GraphQLFloat) {
				return true;
			}

			return false;
		});

		if (hasNumericAggregates) {
			Object.assign(AggregateMethods[collection.collection]!, {
				avg: {
					name: 'avg',
					type: AggregatedFields[collection.collection],
				},
				sum: {
					name: 'sum',
					type: AggregatedFields[collection.collection],
				},
				avgDistinct: {
					name: 'avgDistinct',
					type: AggregatedFields[collection.collection],
				},
				sumDistinct: {
					name: 'sumDistinct',
					type: AggregatedFields[collection.collection],
				},
				min: {
					name: 'min',
					type: AggregatedFields[collection.collection],
				},
				max: {
					name: 'max',
					type: AggregatedFields[collection.collection],
				},
			});
		}

		AggregatedFunctions[collection.collection] = schemaComposer.createObjectTC({
			name: `${collection.collection}_aggregated`,
			fields: AggregateMethods[collection.collection]!,
		});

		const resolver: ResolverDefinition<any, any> = {
			name: collection.collection,
			type: collection.singleton
				? ReadCollectionTypes[collection.collection]!
				: new GraphQLNonNull(
						new GraphQLList(new GraphQLNonNull(ReadCollectionTypes[collection.collection]!.getType())),
					),
			resolve: async ({ info, context }: { info: GraphQLResolveInfo; context: Record<string, any> }) => {
				const result = await resolveQuery(gql, info);
				context['data'] = result;
				return result;
			},
		};

		if (collection.singleton === false) {
			resolver.args = {
				filter: ReadableCollectionFilterTypes[collection.collection]!,
				sort: {
					type: new GraphQLList(GraphQLString),
				},
				limit: {
					type: GraphQLInt,
				},
				offset: {
					type: GraphQLInt,
				},
				page: {
					type: GraphQLInt,
				},
				search: {
					type: GraphQLString,
				},
			};
		} else {
			resolver.args = {
				version: GraphQLString,
			};
		}

		ReadCollectionTypes[collection.collection]!.addResolver(resolver);

		ReadCollectionTypes[collection.collection]!.addResolver({
			name: `${collection.collection}_aggregated`,
			type: new GraphQLNonNull(
				new GraphQLList(new GraphQLNonNull(AggregatedFunctions[collection.collection]!.getType())),
			),
			args: {
				groupBy: new GraphQLList(GraphQLString),
				filter: ReadableCollectionFilterTypes[collection.collection]!,
				limit: {
					type: GraphQLInt,
				},
				offset: {
					type: GraphQLInt,
				},
				page: {
					type: GraphQLInt,
				},
				search: {
					type: GraphQLString,
				},
				sort: {
					type: new GraphQLList(GraphQLString),
				},
			},
			resolve: async ({ info, context }: { info: GraphQLResolveInfo; context: Record<string, any> }) => {
				const result = await resolveQuery(gql, info);
				context['data'] = result;

				return result;
			},
		});

		if (collection.singleton === false) {
			ReadCollectionTypes[collection.collection]!.addResolver({
				name: `${collection.collection}_by_id`,
				type: ReadCollectionTypes[collection.collection]!,
				args: {
					id: new GraphQLNonNull(GraphQLID),
					version: GraphQLString,
				},
				resolve: async ({ info, context }: { info: GraphQLResolveInfo; context: Record<string, any> }) => {
					const result = await resolveQuery(gql, info);
					context['data'] = result;
					return result;
				},
			});
		}

		if (gql.scope === 'items') {
			VersionCollectionTypes[collection.collection]!.addResolver({
				name: `${collection.collection}_by_version`,
				type: VersionCollectionTypes[collection.collection]!,
				args: collection.singleton
					? { version: new GraphQLNonNull(GraphQLString) }
					: {
							version: new GraphQLNonNull(GraphQLString),
							id: new GraphQLNonNull(GraphQLID),
						},
				resolve: async ({ info, context }: { info: GraphQLResolveInfo; context: Record<string, any> }) => {
					const result = await resolveQuery(gql, info);
					context['data'] = result;
					return result;
				},
			});
		}

		const eventName = `${collection.collection}_mutated`;

		if (collection.collection in ReadCollectionTypes) {
			const subscriptionType = schemaComposer.createObjectTC({
				name: eventName,
				fields: {
					key: new GraphQLNonNull(GraphQLID),
					event: subscriptionEventType,
					data: ReadCollectionTypes[collection.collection]!,
				},
			});

			schemaComposer.Subscription.addFields({
				[eventName]: {
					type: subscriptionType,
					args: {
						event: subscriptionEventType,
					},
					subscribe: createSubscriptionGenerator(gql, eventName),
				},
			});
		}
	}

	for (const collection in ReadableCollectionFilterTypes) {
		const quantifier_collection = ReadableCollectionFilterTypes[collection]?.clone(`${collection}_quantifier_filter`);

		quantifier_collection?.addFields({
			_some: ReadableCollectionFilterTypes[collection]!,
			_none: ReadableCollectionFilterTypes[collection]!,
		});

		ReadableCollectionQuantifierFilterTypes[collection] = quantifier_collection!;
	}

	for (const relation of schema.read.relations) {
		if (relation.related_collection) {
			if (SYSTEM_DENY_LIST.includes(relation.related_collection)) continue;

			ReadableCollectionQuantifierFilterTypes[relation.collection]?.addFields({
				[relation.field]: ReadableCollectionFilterTypes[relation.related_collection]!,
			});

			ReadableCollectionFilterTypes[relation.collection]?.addFields({
				[relation.field]: ReadableCollectionFilterTypes[relation.related_collection]!,
			});

			ReadCollectionTypes[relation.collection]?.addFieldArgs(relation.field, {
				filter: ReadableCollectionFilterTypes[relation.related_collection]!,
				sort: {
					type: new GraphQLList(GraphQLString),
				},
				limit: {
					type: GraphQLInt,
				},
				offset: {
					type: GraphQLInt,
				},
				page: {
					type: GraphQLInt,
				},
				search: {
					type: GraphQLString,
				},
			});

			if (relation.meta?.one_field) {
				ReadableCollectionQuantifierFilterTypes[relation.related_collection]?.addFields({
					[relation.meta.one_field]: ReadableCollectionQuantifierFilterTypes[relation.collection]!,
				});

				ReadableCollectionFilterTypes[relation.related_collection]?.addFields({
					[relation.meta.one_field]: ReadableCollectionQuantifierFilterTypes[relation.collection]!,
				});

				ReadCollectionTypes[relation.related_collection]?.addFieldArgs(relation.meta.one_field, {
					filter: ReadableCollectionFilterTypes[relation.collection]!,
					sort: {
						type: new GraphQLList(GraphQLString),
					},
					limit: {
						type: GraphQLInt,
					},
					offset: {
						type: GraphQLInt,
					},
					page: {
						type: GraphQLInt,
					},
					search: {
						type: GraphQLString,
					},
				});
			}
		} else if (relation.meta?.one_allowed_collections) {
			ReadableCollectionQuantifierFilterTypes[relation.collection]?.removeField(relation.field);
			ReadableCollectionFilterTypes[relation.collection]?.removeField(relation.field);

			for (const collection of relation.meta.one_allowed_collections) {
				ReadableCollectionQuantifierFilterTypes[relation.collection]?.addFields({
					[`${relation.field}__${collection}`]: ReadableCollectionFilterTypes[collection]!,
				});

				ReadableCollectionFilterTypes[relation.collection]?.addFields({
					[`${relation.field}__${collection}`]: ReadableCollectionFilterTypes[collection]!,
				});
			}
		}
	}

	return { ReadCollectionTypes, VersionCollectionTypes, ReadableCollectionFilterTypes };
}
