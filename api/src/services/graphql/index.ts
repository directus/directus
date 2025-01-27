import { FUNCTIONS } from '@directus/constants';
import { useEnv } from '@directus/env';
import { ErrorCode, ForbiddenError, InvalidPayloadError, isDirectusError, type DirectusError } from '@directus/errors';
import { isSystemCollection } from '@directus/system-data';
import type {
	Accountability,
	Aggregate,
	CollectionAccess,
	Filter,
	Item,
	PrimaryKey,
	Query,
	SchemaOverview,
} from '@directus/types';
import { parseFilterFunctionPath, toBoolean } from '@directus/utils';
import argon2 from 'argon2';
import type {
	ArgumentNode,
	ExecutionResult,
	FieldNode,
	FormattedExecutionResult,
	FragmentDefinitionNode,
	GraphQLNullableType,
	GraphQLResolveInfo,
	InlineFragmentNode,
	SelectionNode,
	ValueNode,
} from 'graphql';
import {
	GraphQLBoolean,
	GraphQLEnumType,
	GraphQLError,
	GraphQLFloat,
	GraphQLID,
	GraphQLInt,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLScalarType,
	GraphQLSchema,
	GraphQLString,
	GraphQLUnionType,
	NoSchemaIntrospectionCustomRule,
	execute,
	specifiedRules,
	validate,
} from 'graphql';
import type {
	InputTypeComposerFieldConfigMapDefinition,
	ObjectTypeComposerFieldConfigAsObjectDefinition,
	ObjectTypeComposerFieldConfigDefinition,
	ObjectTypeComposerFieldConfigMapDefinition,
	ResolverDefinition,
} from 'graphql-compose';
import { GraphQLJSON, InputTypeComposer, ObjectTypeComposer, SchemaComposer, toInputObjectType } from 'graphql-compose';
import type { Knex } from 'knex';
import { flatten, get, mapKeys, merge, omit, pick, set, transform, uniq } from 'lodash-es';
import { clearSystemCache, getCache } from '../../cache.js';
import {
	DEFAULT_AUTH_PROVIDER,
	GENERATE_SPECIAL,
	REFRESH_COOKIE_OPTIONS,
	SESSION_COOKIE_OPTIONS,
} from '../../constants.js';
import getDatabase from '../../database/index.js';
import { rateLimiter } from '../../middleware/rate-limiter-registration.js';
import { fetchAccountabilityCollectionAccess } from '../../permissions/modules/fetch-accountability-collection-access/fetch-accountability-collection-access.js';
import { fetchAccountabilityPolicyGlobals } from '../../permissions/modules/fetch-accountability-policy-globals/fetch-accountability-policy-globals.js';
import { fetchAllowedFieldMap } from '../../permissions/modules/fetch-allowed-field-map/fetch-allowed-field-map.js';
import { fetchInconsistentFieldMap } from '../../permissions/modules/fetch-inconsistent-field-map/fetch-inconsistent-field-map.js';
import { createDefaultAccountability } from '../../permissions/utils/create-default-accountability.js';
import type { AbstractServiceOptions, AuthenticationMode, GraphQLParams } from '../../types/index.js';
import { generateHash } from '../../utils/generate-hash.js';
import { getGraphQLType } from '../../utils/get-graphql-type.js';
import { getIPFromReq } from '../../utils/get-ip-from-req.js';
import { getSecret } from '../../utils/get-secret.js';
import { getService } from '../../utils/get-service.js';
import isDirectusJWT from '../../utils/is-directus-jwt.js';
import { verifyAccessJWT } from '../../utils/jwt.js';
import { mergeVersionsRaw, mergeVersionsRecursive } from '../../utils/merge-version-data.js';
import { reduceSchema } from '../../utils/reduce-schema.js';
import { sanitizeQuery } from '../../utils/sanitize-query.js';
import { validateQuery } from '../../utils/validate-query.js';
import { AuthenticationService } from '../authentication.js';
import { CollectionsService } from '../collections.js';
import { ExtensionsService } from '../extensions.js';
import { FieldsService } from '../fields.js';
import { FilesService } from '../files.js';
import { RelationsService } from '../relations.js';
import { RevisionsService } from '../revisions.js';
import { RolesService } from '../roles.js';
import { ServerService } from '../server.js';
import { SpecificationService } from '../specifications.js';
import { TFAService } from '../tfa.js';
import { UsersService } from '../users.js';
import { UtilsService } from '../utils.js';
import { VersionsService } from '../versions.js';
import { GraphQLExecutionError, GraphQLValidationError } from './errors/index.js';
import { cache } from './schema-cache.js';
import { createSubscriptionGenerator } from './subscription.js';
import { GraphQLBigInt } from './types/bigint.js';
import { GraphQLDate } from './types/date.js';
import { GraphQLGeoJSON } from './types/geojson.js';
import { GraphQLHash } from './types/hash.js';
import { GraphQLStringOrFloat } from './types/string-or-float.js';
import { GraphQLVoid } from './types/void.js';
import { addPathToValidationError } from './utils/add-path-to-validation-error.js';
import processError from './utils/process-error.js';
import { sanitizeGraphqlSchema } from './utils/sanitize-gql-schema.js';

const env = useEnv();

const validationRules = Array.from(specifiedRules);

if (env['GRAPHQL_INTROSPECTION'] === false) {
	validationRules.push(NoSchemaIntrospectionCustomRule);
}

/**
 * These should be ignored in the context of GraphQL, and/or are replaced by a custom resolver (for non-standard structures)
 */
const SYSTEM_DENY_LIST = [
	'directus_collections',
	'directus_fields',
	'directus_relations',
	'directus_migrations',
	'directus_sessions',
	'directus_extensions',
];

const READ_ONLY = ['directus_activity', 'directus_revisions'];

export class GraphQLService {
	accountability: Accountability | null;
	knex: Knex;
	schema: SchemaOverview;
	scope: 'items' | 'system';

	constructor(options: AbstractServiceOptions & { scope: 'items' | 'system' }) {
		this.accountability = options?.accountability || null;
		this.knex = options?.knex || getDatabase();
		this.schema = options.schema;
		this.scope = options.scope;
	}

	/**
	 * Execute a GraphQL structure
	 */
	async execute({
		document,
		variables,
		operationName,
		contextValue,
	}: GraphQLParams): Promise<FormattedExecutionResult> {
		const schema = await this.getSchema();

		const validationErrors = validate(schema, document, validationRules).map((validationError) =>
			addPathToValidationError(validationError),
		);

		if (validationErrors.length > 0) {
			throw new GraphQLValidationError({ errors: validationErrors });
		}

		let result: ExecutionResult;

		try {
			result = await execute({
				schema,
				document,
				contextValue,
				variableValues: variables,
				operationName,
			});
		} catch (err: any) {
			throw new GraphQLExecutionError({ errors: [err.message] });
		}

		const formattedResult: FormattedExecutionResult = {};

		if (result['data']) formattedResult.data = result['data'];

		if (result['errors']) {
			formattedResult.errors = result['errors'].map((error) => processError(this.accountability, error));
		}

		if (result['extensions']) formattedResult.extensions = result['extensions'];

		return formattedResult;
	}

	/**
	 * Generate the GraphQL schema. Pulls from the schema information generated by the get-schema util.
	 */
	async getSchema(): Promise<GraphQLSchema>;
	async getSchema(type: 'schema'): Promise<GraphQLSchema>;
	async getSchema(type: 'sdl'): Promise<GraphQLSchema | string>;
	async getSchema(type: 'schema' | 'sdl' = 'schema'): Promise<GraphQLSchema | string> {
		const key = `${this.scope}_${type}_${this.accountability?.role}_${this.accountability?.user}`;

		const cachedSchema = cache.get(key);

		if (cachedSchema) return cachedSchema;

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this;

		const schemaComposer = new SchemaComposer<GraphQLParams['contextValue']>();

		let schema: { read: SchemaOverview; create: SchemaOverview; update: SchemaOverview; delete: SchemaOverview };

		const sanitizedSchema = sanitizeGraphqlSchema(this.schema);

		if (!this.accountability || this.accountability.admin) {
			schema = {
				read: sanitizedSchema,
				create: sanitizedSchema,
				update: sanitizedSchema,
				delete: sanitizedSchema,
			};
		} else {
			schema = {
				read: reduceSchema(
					sanitizedSchema,
					await fetchAllowedFieldMap(
						{
							accountability: this.accountability,
							action: 'read',
						},
						{ schema: this.schema, knex: this.knex },
					),
				),
				create: reduceSchema(
					sanitizedSchema,
					await fetchAllowedFieldMap(
						{
							accountability: this.accountability,
							action: 'create',
						},
						{ schema: this.schema, knex: this.knex },
					),
				),
				update: reduceSchema(
					sanitizedSchema,
					await fetchAllowedFieldMap(
						{
							accountability: this.accountability,
							action: 'update',
						},
						{ schema: this.schema, knex: this.knex },
					),
				),
				delete: reduceSchema(
					sanitizedSchema,
					await fetchAllowedFieldMap(
						{
							accountability: this.accountability,
							action: 'delete',
						},
						{ schema: this.schema, knex: this.knex },
					),
				),
			};
		}

		const inconsistentFields = {
			read: await fetchInconsistentFieldMap(
				{
					accountability: this.accountability,
					action: 'read',
				},
				{ schema: this.schema, knex: this.knex },
			),
			create: await fetchInconsistentFieldMap(
				{
					accountability: this.accountability,
					action: 'create',
				},
				{ schema: this.schema, knex: this.knex },
			),
			update: await fetchInconsistentFieldMap(
				{
					accountability: this.accountability,
					action: 'update',
				},
				{ schema: this.schema, knex: this.knex },
			),
			delete: await fetchInconsistentFieldMap(
				{
					accountability: this.accountability,
					action: 'delete',
				},
				{ schema: this.schema, knex: this.knex },
			),
		};

		const subscriptionEventType = schemaComposer.createEnumTC({
			name: 'EventEnum',
			values: {
				create: { value: 'create' },
				update: { value: 'update' },
				delete: { value: 'delete' },
			},
		});

		const { ReadCollectionTypes, VersionCollectionTypes } = getReadableTypes();
		const { CreateCollectionTypes, UpdateCollectionTypes, DeleteCollectionTypes } = getWritableTypes();

		const scopeFilter = (collection: SchemaOverview['collections'][string]) => {
			if (this.scope === 'items' && isSystemCollection(collection.collection)) return false;

			if (this.scope === 'system') {
				if (isSystemCollection(collection.collection) === false) return false;
				if (SYSTEM_DENY_LIST.includes(collection.collection)) return false;
			}

			return true;
		};

		if (this.scope === 'system') {
			this.injectSystemResolvers(
				schemaComposer,
				{
					CreateCollectionTypes,
					ReadCollectionTypes,
					UpdateCollectionTypes,
				},
				schema,
			);
		}

		const readableCollections = Object.values(schema.read.collections)
			.filter((collection) => collection.collection in ReadCollectionTypes)
			.filter(scopeFilter);

		if (readableCollections.length > 0) {
			schemaComposer.Query.addFields(
				readableCollections.reduce(
					(acc, collection) => {
						const collectionName = this.scope === 'items' ? collection.collection : collection.collection.substring(9);
						acc[collectionName] = ReadCollectionTypes[collection.collection]!.getResolver(collection.collection);

						if (this.schema.collections[collection.collection]!.singleton === false) {
							acc[`${collectionName}_by_id`] = ReadCollectionTypes[collection.collection]!.getResolver(
								`${collection.collection}_by_id`,
							);

							acc[`${collectionName}_aggregated`] = ReadCollectionTypes[collection.collection]!.getResolver(
								`${collection.collection}_aggregated`,
							);
						}

						if (this.scope === 'items') {
							acc[`${collectionName}_by_version`] = VersionCollectionTypes[collection.collection]!.getResolver(
								`${collection.collection}_by_version`,
							);
						}

						return acc;
					},
					{} as ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>,
				),
			);
		} else {
			schemaComposer.Query.addFields({
				_empty: {
					type: GraphQLVoid,
					description: "There's no data to query.",
				},
			});
		}

		if (Object.keys(schema.create.collections).length > 0) {
			schemaComposer.Mutation.addFields(
				Object.values(schema.create.collections)
					.filter((collection) => collection.collection in CreateCollectionTypes && collection.singleton === false)
					.filter(scopeFilter)
					.filter((collection) => READ_ONLY.includes(collection.collection) === false)
					.reduce(
						(acc, collection) => {
							const collectionName =
								this.scope === 'items' ? collection.collection : collection.collection.substring(9);

							acc[`create_${collectionName}_items`] = CreateCollectionTypes[collection.collection]!.getResolver(
								`create_${collection.collection}_items`,
							);

							acc[`create_${collectionName}_item`] = CreateCollectionTypes[collection.collection]!.getResolver(
								`create_${collection.collection}_item`,
							);

							return acc;
						},
						{} as ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>,
					),
			);
		}

		if (Object.keys(schema.update.collections).length > 0) {
			schemaComposer.Mutation.addFields(
				Object.values(schema.update.collections)
					.filter((collection) => collection.collection in UpdateCollectionTypes)
					.filter(scopeFilter)
					.filter((collection) => READ_ONLY.includes(collection.collection) === false)
					.reduce(
						(acc, collection) => {
							const collectionName =
								this.scope === 'items' ? collection.collection : collection.collection.substring(9);

							if (collection.singleton) {
								acc[`update_${collectionName}`] = UpdateCollectionTypes[collection.collection]!.getResolver(
									`update_${collection.collection}`,
								);
							} else {
								acc[`update_${collectionName}_items`] = UpdateCollectionTypes[collection.collection]!.getResolver(
									`update_${collection.collection}_items`,
								);

								acc[`update_${collectionName}_batch`] = UpdateCollectionTypes[collection.collection]!.getResolver(
									`update_${collection.collection}_batch`,
								);

								acc[`update_${collectionName}_item`] = UpdateCollectionTypes[collection.collection]!.getResolver(
									`update_${collection.collection}_item`,
								);
							}

							return acc;
						},
						{} as ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>,
					),
			);
		}

		if (Object.keys(schema.delete.collections).length > 0) {
			schemaComposer.Mutation.addFields(
				Object.values(schema.delete.collections)
					.filter((collection) => collection.singleton === false)
					.filter(scopeFilter)
					.filter((collection) => READ_ONLY.includes(collection.collection) === false)
					.reduce(
						(acc, collection) => {
							const collectionName =
								this.scope === 'items' ? collection.collection : collection.collection.substring(9);

							acc[`delete_${collectionName}_items`] = DeleteCollectionTypes['many']!.getResolver(
								`delete_${collection.collection}_items`,
							);

							acc[`delete_${collectionName}_item`] = DeleteCollectionTypes['one']!.getResolver(
								`delete_${collection.collection}_item`,
							);

							return acc;
						},
						{} as ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>,
					),
			);
		}

		if (type === 'sdl') {
			const sdl = schemaComposer.toSDL();
			cache.set(key, sdl);
			return sdl;
		}

		const gqlSchema = schemaComposer.buildSchema();
		cache.set(key, gqlSchema);
		return gqlSchema;

		/**
		 * Construct an object of types for every collection, using the permitted fields per action type
		 * as it's fields.
		 */
		function getTypes(action: 'read' | 'create' | 'update' | 'delete') {
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
							let type: GraphQLScalarType | GraphQLNonNull<GraphQLNullableType> = getGraphQLType(
								field.type,
								field.special,
							);

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
											const funcFields = Object.keys(DateTimeFunctions.getFields()).map(
												(key) => `${field.field}_${key}`,
											);

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

				if (self.scope === 'items') {
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

						if (self.scope === 'items') {
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
					// NOTE: There are no union input types in GraphQL, so this only applies to Read actions
					CollectionTypes[relation.collection]?.addFields({
						[relation.field]: {
							type: new GraphQLUnionType({
								name: `${relation.collection}_${relation.field}_union`,
								types: relation.meta.one_allowed_collections.map((collection) =>
									CollectionTypes[collection]!.getType(),
								),
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

		/**
		 * Create readable types and attach resolvers for each. Also prepares full filter argument structures
		 */
		function getReadableTypes() {
			const { CollectionTypes: ReadCollectionTypes, VersionTypes: VersionCollectionTypes } = getTypes('read');

			const ReadableCollectionFilterTypes: Record<string, InputTypeComposer> = {};

			const AggregatedFunctions: Record<string, ObjectTypeComposer<any, any>> = {};
			const AggregatedFields: Record<string, ObjectTypeComposer<any, any>> = {};
			const AggregateMethods: Record<string, ObjectTypeComposerFieldConfigMapDefinition<any, any>> = {};

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
						const result = await self.resolveQuery(info);
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
						const result = await self.resolveQuery(info);
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
							const result = await self.resolveQuery(info);
							context['data'] = result;
							return result;
						},
					});
				}

				if (self.scope === 'items') {
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
							const result = await self.resolveQuery(info);
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
							subscribe: createSubscriptionGenerator(self, eventName),
						},
					});
				}
			}

			for (const relation of schema.read.relations) {
				if (relation.related_collection) {
					if (SYSTEM_DENY_LIST.includes(relation.related_collection)) continue;

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
						ReadableCollectionFilterTypes[relation.related_collection]?.addFields({
							[relation.meta.one_field]: ReadableCollectionFilterTypes[relation.collection]!,
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
					ReadableCollectionFilterTypes[relation.collection]?.removeField('item');

					for (const collection of relation.meta.one_allowed_collections) {
						ReadableCollectionFilterTypes[relation.collection]?.addFields({
							[`item__${collection}`]: ReadableCollectionFilterTypes[collection]!,
						});
					}
				}
			}

			return { ReadCollectionTypes, VersionCollectionTypes, ReadableCollectionFilterTypes };
		}

		function getWritableTypes() {
			const { CollectionTypes: CreateCollectionTypes } = getTypes('create');
			const { CollectionTypes: UpdateCollectionTypes } = getTypes('update');
			const DeleteCollectionTypes: Record<string, ObjectTypeComposer<any, any>> = {};

			for (const collection of Object.values(schema.create.collections)) {
				if (Object.keys(collection.fields).length === 0) continue;
				if (SYSTEM_DENY_LIST.includes(collection.collection)) continue;
				if (collection.collection in CreateCollectionTypes === false) continue;

				const collectionIsReadable = collection.collection in ReadCollectionTypes;

				const creatableFields = CreateCollectionTypes[collection.collection]?.getFields() || {};

				if (Object.keys(creatableFields).length > 0) {
					const resolverDefinition: ResolverDefinition<any, any> = {
						name: `create_${collection.collection}_items`,
						type: collectionIsReadable
							? new GraphQLNonNull(
									new GraphQLList(new GraphQLNonNull(ReadCollectionTypes[collection.collection]!.getType())),
							  )
							: GraphQLBoolean,
						resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
							await self.resolveMutation(args, info),
					};

					if (collectionIsReadable) {
						resolverDefinition.args = ReadCollectionTypes[collection.collection]!.getResolver(
							collection.collection,
						).getArgs();
					}

					CreateCollectionTypes[collection.collection]!.addResolver(resolverDefinition);

					CreateCollectionTypes[collection.collection]!.addResolver({
						name: `create_${collection.collection}_item`,
						type: collectionIsReadable ? ReadCollectionTypes[collection.collection]! : GraphQLBoolean,
						resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
							await self.resolveMutation(args, info),
					});

					CreateCollectionTypes[collection.collection]!.getResolver(`create_${collection.collection}_items`).addArgs({
						...CreateCollectionTypes[collection.collection]!.getResolver(
							`create_${collection.collection}_items`,
						).getArgs(),
						data: [
							toInputObjectType(CreateCollectionTypes[collection.collection]!).setTypeName(
								`create_${collection.collection}_input`,
							).NonNull,
						],
					});

					CreateCollectionTypes[collection.collection]!.getResolver(`create_${collection.collection}_item`).addArgs({
						...CreateCollectionTypes[collection.collection]!.getResolver(
							`create_${collection.collection}_item`,
						).getArgs(),
						data: toInputObjectType(CreateCollectionTypes[collection.collection]!).setTypeName(
							`create_${collection.collection}_input`,
						).NonNull,
					});
				}
			}

			for (const collection of Object.values(schema.update.collections)) {
				if (Object.keys(collection.fields).length === 0) continue;
				if (SYSTEM_DENY_LIST.includes(collection.collection)) continue;
				if (collection.collection in UpdateCollectionTypes === false) continue;

				const collectionIsReadable = collection.collection in ReadCollectionTypes;

				const updatableFields = UpdateCollectionTypes[collection.collection]?.getFields() || {};

				if (Object.keys(updatableFields).length > 0) {
					if (collection.singleton) {
						UpdateCollectionTypes[collection.collection]!.addResolver({
							name: `update_${collection.collection}`,
							type: collectionIsReadable ? ReadCollectionTypes[collection.collection]! : GraphQLBoolean,
							args: {
								data: toInputObjectType(UpdateCollectionTypes[collection.collection]!).setTypeName(
									`update_${collection.collection}_input`,
								).NonNull,
							},
							resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
								await self.resolveMutation(args, info),
						});
					} else {
						UpdateCollectionTypes[collection.collection]!.addResolver({
							name: `update_${collection.collection}_batch`,
							type: collectionIsReadable
								? new GraphQLNonNull(
										new GraphQLList(new GraphQLNonNull(ReadCollectionTypes[collection.collection]!.getType())),
								  )
								: GraphQLBoolean,
							args: {
								...(collectionIsReadable
									? ReadCollectionTypes[collection.collection]!.getResolver(collection.collection).getArgs()
									: {}),
								data: [
									toInputObjectType(UpdateCollectionTypes[collection.collection]!).setTypeName(
										`update_${collection.collection}_input`,
									).NonNull,
								],
							},
							resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
								await self.resolveMutation(args, info),
						});

						UpdateCollectionTypes[collection.collection]!.addResolver({
							name: `update_${collection.collection}_items`,
							type: collectionIsReadable
								? new GraphQLNonNull(
										new GraphQLList(new GraphQLNonNull(ReadCollectionTypes[collection.collection]!.getType())),
								  )
								: GraphQLBoolean,
							args: {
								...(collectionIsReadable
									? ReadCollectionTypes[collection.collection]!.getResolver(collection.collection).getArgs()
									: {}),
								ids: new GraphQLNonNull(new GraphQLList(GraphQLID)),
								data: toInputObjectType(UpdateCollectionTypes[collection.collection]!).setTypeName(
									`update_${collection.collection}_input`,
								).NonNull,
							},
							resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
								await self.resolveMutation(args, info),
						});

						UpdateCollectionTypes[collection.collection]!.addResolver({
							name: `update_${collection.collection}_item`,
							type: collectionIsReadable ? ReadCollectionTypes[collection.collection]! : GraphQLBoolean,
							args: {
								id: new GraphQLNonNull(GraphQLID),
								data: toInputObjectType(UpdateCollectionTypes[collection.collection]!).setTypeName(
									`update_${collection.collection}_input`,
								).NonNull,
							},
							resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
								await self.resolveMutation(args, info),
						});
					}
				}
			}

			DeleteCollectionTypes['many'] = schemaComposer.createObjectTC({
				name: `delete_many`,
				fields: {
					ids: new GraphQLNonNull(new GraphQLList(GraphQLID)),
				},
			});

			DeleteCollectionTypes['one'] = schemaComposer.createObjectTC({
				name: `delete_one`,
				fields: {
					id: new GraphQLNonNull(GraphQLID),
				},
			});

			for (const collection of Object.values(schema.delete.collections)) {
				DeleteCollectionTypes['many']!.addResolver({
					name: `delete_${collection.collection}_items`,
					type: DeleteCollectionTypes['many'],
					args: {
						ids: new GraphQLNonNull(new GraphQLList(GraphQLID)),
					},
					resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
						await self.resolveMutation(args, info),
				});

				DeleteCollectionTypes['one'].addResolver({
					name: `delete_${collection.collection}_item`,
					type: DeleteCollectionTypes['one'],
					args: {
						id: new GraphQLNonNull(GraphQLID),
					},
					resolve: async ({ args, info }: { args: Record<string, any>; info: GraphQLResolveInfo }) =>
						await self.resolveMutation(args, info),
				});
			}

			return { CreateCollectionTypes, UpdateCollectionTypes, DeleteCollectionTypes };
		}
	}

	/**
	 * Generic resolver that's used for every "regular" items/system query. Converts the incoming GraphQL AST / fragments into
	 * Directus' query structure which is then executed by the services.
	 */
	async resolveQuery(info: GraphQLResolveInfo): Promise<Partial<Item> | null> {
		let collection = info.fieldName;
		if (this.scope === 'system') collection = `directus_${collection}`;
		const selections = this.replaceFragmentsInSelections(info.fieldNodes[0]?.selectionSet?.selections, info.fragments);

		if (!selections) return null;
		const args: Record<string, any> = this.parseArgs(info.fieldNodes[0]!.arguments || [], info.variableValues);

		let query: Query;
		let versionRaw = false;

		const isAggregate = collection.endsWith('_aggregated') && collection in this.schema.collections === false;

		if (isAggregate) {
			query = this.getAggregateQuery(args, selections);
			collection = collection.slice(0, -11);
		} else {
			query = this.getQuery(args, selections, info.variableValues);

			if (collection.endsWith('_by_id') && collection in this.schema.collections === false) {
				collection = collection.slice(0, -6);
			}

			if (collection.endsWith('_by_version') && collection in this.schema.collections === false) {
				collection = collection.slice(0, -11);
				versionRaw = true;
			}
		}

		if (args['id']) {
			query.filter = {
				_and: [
					query.filter || {},
					{
						[this.schema.collections[collection]!.primary]: {
							_eq: args['id'],
						},
					},
				],
			};

			query.limit = 1;
		}

		// Transform count(a.b.c) into a.b.count(c)
		if (query.fields?.length) {
			for (let fieldIndex = 0; fieldIndex < query.fields.length; fieldIndex++) {
				query.fields[fieldIndex] = parseFilterFunctionPath(query.fields[fieldIndex]!);
			}
		}

		const result = await this.read(collection, query);

		if (args['version']) {
			const versionsService = new VersionsService({ accountability: this.accountability, schema: this.schema });

			const saves = await versionsService.getVersionSaves(args['version'], collection, args['id']);

			if (saves) {
				if (this.schema.collections[collection]!.singleton) {
					return versionRaw
						? mergeVersionsRaw(result, saves)
						: mergeVersionsRecursive(result, saves, collection, this.schema);
				} else {
					if (result?.[0] === undefined) return null;

					return versionRaw
						? mergeVersionsRaw(result[0], saves)
						: mergeVersionsRecursive(result[0], saves, collection, this.schema);
				}
			}
		}

		if (args['id']) {
			return result?.[0] || null;
		}

		if (query.group) {
			// for every entry in result add a group field based on query.group;
			const aggregateKeys = Object.keys(query.aggregate ?? {});

			result['map']((field: Item) => {
				field['group'] = omit(field, aggregateKeys);
			});
		}

		return result;
	}

	async resolveMutation(
		args: Record<string, any>,
		info: GraphQLResolveInfo,
	): Promise<Partial<Item> | boolean | undefined> {
		const action = info.fieldName.split('_')[0] as 'create' | 'update' | 'delete';
		let collection = info.fieldName.substring(action.length + 1);
		if (this.scope === 'system') collection = `directus_${collection}`;

		const selections = this.replaceFragmentsInSelections(info.fieldNodes[0]?.selectionSet?.selections, info.fragments);
		const query = this.getQuery(args, selections || [], info.variableValues);

		const singleton =
			collection.endsWith('_batch') === false &&
			collection.endsWith('_items') === false &&
			collection.endsWith('_item') === false &&
			collection in this.schema.collections;

		const single = collection.endsWith('_items') === false && collection.endsWith('_batch') === false;
		const batchUpdate = action === 'update' && collection.endsWith('_batch');

		if (collection.endsWith('_batch')) collection = collection.slice(0, -6);
		if (collection.endsWith('_items')) collection = collection.slice(0, -6);
		if (collection.endsWith('_item')) collection = collection.slice(0, -5);

		if (singleton && action === 'update') {
			return await this.upsertSingleton(collection, args['data'], query);
		}

		const service = getService(collection, {
			knex: this.knex,
			accountability: this.accountability,
			schema: this.schema,
		});

		const hasQuery = (query.fields || []).length > 0;

		try {
			if (single) {
				if (action === 'create') {
					const key = await service.createOne(args['data']);
					return hasQuery ? await service.readOne(key, query) : true;
				}

				if (action === 'update') {
					const key = await service.updateOne(args['id'], args['data']);
					return hasQuery ? await service.readOne(key, query) : true;
				}

				if (action === 'delete') {
					await service.deleteOne(args['id']);
					return { id: args['id'] };
				}

				return undefined;
			} else {
				if (action === 'create') {
					const keys = await service.createMany(args['data']);
					return hasQuery ? await service.readMany(keys, query) : true;
				}

				if (action === 'update') {
					const keys: PrimaryKey[] = [];

					if (batchUpdate) {
						keys.push(...(await service.updateBatch(args['data'])));
					} else {
						keys.push(...(await service.updateMany(args['ids'], args['data'])));
					}

					return hasQuery ? await service.readMany(keys, query) : true;
				}

				if (action === 'delete') {
					const keys = await service.deleteMany(args['ids']);
					return { ids: keys };
				}

				return undefined;
			}
		} catch (err: any) {
			return this.formatError(err);
		}
	}

	/**
	 * Execute the read action on the correct service. Checks for singleton as well.
	 */
	async read(collection: string, query: Query): Promise<Partial<Item>> {
		const service = getService(collection, {
			knex: this.knex,
			accountability: this.accountability,
			schema: this.schema,
		});

		const result = this.schema.collections[collection]!.singleton
			? await service.readSingleton(query, { stripNonRequested: false })
			: await service.readByQuery(query, { stripNonRequested: false });

		return result;
	}

	/**
	 * Upsert and read singleton item
	 */
	async upsertSingleton(
		collection: string,
		body: Record<string, any> | Record<string, any>[],
		query: Query,
	): Promise<Partial<Item> | boolean> {
		const service = getService(collection, {
			knex: this.knex,
			accountability: this.accountability,
			schema: this.schema,
		});

		try {
			await service.upsertSingleton(body);

			if ((query.fields || []).length > 0) {
				const result = await service.readSingleton(query);
				return result;
			}

			return true;
		} catch (err: any) {
			throw this.formatError(err);
		}
	}

	/**
	 * GraphQL's regular resolver `args` variable only contains the "top-level" arguments. Seeing that we convert the
	 * whole nested tree into one big query using Directus' own query resolver, we want to have a nested structure of
	 * arguments for the whole resolving tree, which can later be transformed into Directus' AST using `deep`.
	 * In order to do that, we'll parse over all ArgumentNodes and ObjectFieldNodes to manually recreate an object structure
	 * of arguments
	 */
	parseArgs(args: readonly ArgumentNode[], variableValues: GraphQLResolveInfo['variableValues']): Record<string, any> {
		if (!args || args['length'] === 0) return {};

		const parse = (node: ValueNode): any => {
			switch (node.kind) {
				case 'Variable':
					return variableValues[node.name.value];
				case 'ListValue':
					return node.values.map(parse);
				case 'ObjectValue':
					return Object.fromEntries(node.fields.map((node) => [node.name.value, parse(node.value)]));
				case 'NullValue':
					return null;
				case 'StringValue':
					return String(node.value);
				case 'IntValue':
				case 'FloatValue':
					return Number(node.value);
				case 'BooleanValue':
					return Boolean(node.value);
				case 'EnumValue':
				default:
					return 'value' in node ? node.value : null;
			}
		};

		const argsObject = Object.fromEntries(args['map']((arg) => [arg.name.value, parse(arg.value)]));

		return argsObject;
	}

	/**
	 * Get a Directus Query object from the parsed arguments (rawQuery) and GraphQL AST selectionSet. Converts SelectionSet into
	 * Directus' `fields` query for use in the resolver. Also applies variables where appropriate.
	 */
	getQuery(
		rawQuery: Query,
		selections: readonly SelectionNode[],
		variableValues: GraphQLResolveInfo['variableValues'],
	): Query {
		const query: Query = sanitizeQuery(rawQuery, this.accountability);

		const parseAliases = (selections: readonly SelectionNode[]) => {
			const aliases: Record<string, string> = {};

			for (const selection of selections) {
				if (selection.kind !== 'Field') continue;

				if (selection.alias?.value) {
					aliases[selection.alias.value] = selection.name.value;
				}
			}

			return aliases;
		};

		const parseFields = (selections: readonly SelectionNode[], parent?: string): string[] => {
			const fields: string[] = [];

			for (let selection of selections) {
				if ((selection.kind === 'Field' || selection.kind === 'InlineFragment') !== true) continue;

				selection = selection as FieldNode | InlineFragmentNode;

				let current: string;
				let currentAlias: string | null = null;

				// Union type (Many-to-Any)
				if (selection.kind === 'InlineFragment') {
					if (selection.typeCondition!.name.value.startsWith('__')) continue;

					current = `${parent}:${selection.typeCondition!.name.value}`;
				}
				// Any other field type
				else {
					// filter out graphql pointers, like __typename
					if (selection.name.value.startsWith('__')) continue;

					current = selection.name.value;

					if (selection.alias) {
						currentAlias = selection.alias.value;
					}

					if (parent) {
						current = `${parent}.${current}`;

						if (currentAlias) {
							currentAlias = `${parent}.${currentAlias}`;

							// add nested aliases into deep query
							if (selection.selectionSet) {
								if (!query.deep) query.deep = {};

								set(
									query.deep,
									parent,
									merge({}, get(query.deep, parent), { _alias: { [selection.alias!.value]: selection.name.value } }),
								);
							}
						}
					}
				}

				if (selection.selectionSet) {
					let children: string[];

					if (current.endsWith('_func')) {
						children = [];

						const rootField = current.slice(0, -5);

						for (const subSelection of selection.selectionSet.selections) {
							if (subSelection.kind !== 'Field') continue;
							if (subSelection.name!.value.startsWith('__')) continue;
							children.push(`${subSelection.name!.value}(${rootField})`);
						}
					} else {
						children = parseFields(selection.selectionSet.selections, currentAlias ?? current);
					}

					fields.push(...children);
				} else {
					fields.push(current);
				}

				if (selection.kind === 'Field' && selection.arguments && selection.arguments.length > 0) {
					if (selection.arguments && selection.arguments.length > 0) {
						if (!query.deep) query.deep = {};

						const args: Record<string, any> = this.parseArgs(selection.arguments, variableValues);

						set(
							query.deep,
							currentAlias ?? current,
							merge(
								{},
								get(query.deep, currentAlias ?? current),
								mapKeys(sanitizeQuery(args, this.accountability), (_value, key) => `_${key}`),
							),
						);
					}
				}
			}

			return uniq(fields);
		};

		query.alias = parseAliases(selections);
		query.fields = parseFields(selections);
		if (query.filter) query.filter = this.replaceFuncs(query.filter);
		query.deep = this.replaceFuncs(query.deep as any) as any;

		validateQuery(query);

		return query;
	}

	/**
	 * Resolve the aggregation query based on the requested aggregated fields
	 */
	getAggregateQuery(rawQuery: Query, selections: readonly SelectionNode[]): Query {
		const query: Query = sanitizeQuery(rawQuery, this.accountability);

		query.aggregate = {};

		for (let aggregationGroup of selections) {
			if ((aggregationGroup.kind === 'Field') !== true) continue;

			aggregationGroup = aggregationGroup as FieldNode;

			// filter out graphql pointers, like __typename
			if (aggregationGroup.name.value.startsWith('__')) continue;

			const aggregateProperty = aggregationGroup.name.value as keyof Aggregate;

			query.aggregate[aggregateProperty] =
				aggregationGroup.selectionSet?.selections
					// filter out graphql pointers, like __typename
					.filter((selectionNode) => !(selectionNode as FieldNode)?.name.value.startsWith('__'))
					.map((selectionNode) => {
						selectionNode = selectionNode as FieldNode;
						return selectionNode.name.value;
					}) ?? [];
		}

		if (query.filter) {
			query.filter = this.replaceFuncs(query.filter);
		}

		validateQuery(query);

		return query;
	}

	/**
	 * Replace functions from GraphQL format to Directus-Filter format
	 */
	replaceFuncs(filter: Filter): Filter {
		return replaceFuncDeep(filter);

		function replaceFuncDeep(filter: Record<string, any>) {
			return transform(filter, (result: Record<string, any>, value, key) => {
				const isFunctionKey =
					typeof key === 'string' && key.endsWith('_func') && FUNCTIONS.includes(Object.keys(value)[0]! as any);

				if (isFunctionKey) {
					const functionName = Object.keys(value)[0]!;
					const fieldName = key.slice(0, -5);

					result[`${functionName}(${fieldName})`] = Object.values(value)[0]!;
				} else {
					result[key] = value?.constructor === Object || value?.constructor === Array ? replaceFuncDeep(value) : value;
				}
			});
		}
	}

	/**
	 * Convert Directus-Exception into a GraphQL format, so it can be returned by GraphQL properly.
	 */
	formatError(error: DirectusError | DirectusError[]): GraphQLError {
		if (Array.isArray(error)) {
			set(error[0]!, 'extensions.code', error[0]!.code);
			return new GraphQLError(error[0]!.message, undefined, undefined, undefined, undefined, error[0]);
		}

		set(error, 'extensions.code', error.code);
		return new GraphQLError(error.message, undefined, undefined, undefined, undefined, error);
	}

	/**
	 * Replace all fragments in a selectionset for the actual selection set as defined in the fragment
	 * Effectively merges the selections with the fragments used in those selections
	 */
	replaceFragmentsInSelections(
		selections: readonly SelectionNode[] | undefined,
		fragments: Record<string, FragmentDefinitionNode>,
	): readonly SelectionNode[] | null {
		if (!selections) return null;

		const result = flatten(
			selections.map((selection) => {
				// Fragments can contains fragments themselves. This allows for nested fragments
				if (selection.kind === 'FragmentSpread') {
					return this.replaceFragmentsInSelections(fragments[selection.name.value]!.selectionSet.selections, fragments);
				}

				// Nested relational fields can also contain fragments
				if ((selection.kind === 'Field' || selection.kind === 'InlineFragment') && selection.selectionSet) {
					selection.selectionSet.selections = this.replaceFragmentsInSelections(
						selection.selectionSet.selections,
						fragments,
					) as readonly SelectionNode[];
				}

				return selection;
			}),
		).filter((s) => s) as SelectionNode[];

		return result;
	}

	injectSystemResolvers(
		schemaComposer: SchemaComposer<GraphQLParams['contextValue']>,
		{
			CreateCollectionTypes,
			ReadCollectionTypes,
			UpdateCollectionTypes,
		}: {
			CreateCollectionTypes: Record<string, ObjectTypeComposer<any, any>>;
			ReadCollectionTypes: Record<string, ObjectTypeComposer<any, any>>;
			UpdateCollectionTypes: Record<string, ObjectTypeComposer<any, any>>;
		},
		schema: {
			create: SchemaOverview;
			read: SchemaOverview;
			update: SchemaOverview;
			delete: SchemaOverview;
		},
	): SchemaComposer<any> {
		const AuthTokens = schemaComposer.createObjectTC({
			name: 'auth_tokens',
			fields: {
				access_token: GraphQLString,
				expires: GraphQLBigInt,
				refresh_token: GraphQLString,
			},
		});

		const AuthMode = new GraphQLEnumType({
			name: 'auth_mode',
			values: {
				json: { value: 'json' },
				cookie: { value: 'cookie' },
				session: { value: 'session' },
			},
		});

		const ServerInfo = schemaComposer.createObjectTC({
			name: 'server_info',
			fields: {
				project: {
					type: new GraphQLObjectType({
						name: 'server_info_project',
						fields: {
							project_name: { type: GraphQLString },
							project_descriptor: { type: GraphQLString },
							project_logo: { type: GraphQLString },
							project_color: { type: GraphQLString },
							default_language: { type: GraphQLString },
							public_foreground: { type: GraphQLString },
							public_background: { type: GraphQLString },
							public_note: { type: GraphQLString },
							custom_css: { type: GraphQLString },
							public_registration: { type: GraphQLBoolean },
							public_registration_verify_email: { type: GraphQLBoolean },
						},
					}),
				},
			},
		});

		if (this.accountability?.user) {
			ServerInfo.addFields({
				rateLimit: env['RATE_LIMITER_ENABLED']
					? {
							type: new GraphQLObjectType({
								name: 'server_info_rate_limit',
								fields: {
									points: { type: GraphQLInt },
									duration: { type: GraphQLInt },
								},
							}),
					  }
					: GraphQLBoolean,
				rateLimitGlobal: env['RATE_LIMITER_GLOBAL_ENABLED']
					? {
							type: new GraphQLObjectType({
								name: 'server_info_rate_limit_global',
								fields: {
									points: { type: GraphQLInt },
									duration: { type: GraphQLInt },
								},
							}),
					  }
					: GraphQLBoolean,
				websocket: toBoolean(env['WEBSOCKETS_ENABLED'])
					? {
							type: new GraphQLObjectType({
								name: 'server_info_websocket',
								fields: {
									rest: {
										type: toBoolean(env['WEBSOCKETS_REST_ENABLED'])
											? new GraphQLObjectType({
													name: 'server_info_websocket_rest',
													fields: {
														authentication: {
															type: new GraphQLEnumType({
																name: 'server_info_websocket_rest_authentication',
																values: {
																	public: { value: 'public' },
																	handshake: { value: 'handshake' },
																	strict: { value: 'strict' },
																},
															}),
														},
														path: { type: GraphQLString },
													},
											  })
											: GraphQLBoolean,
									},
									graphql: {
										type: toBoolean(env['WEBSOCKETS_GRAPHQL_ENABLED'])
											? new GraphQLObjectType({
													name: 'server_info_websocket_graphql',
													fields: {
														authentication: {
															type: new GraphQLEnumType({
																name: 'server_info_websocket_graphql_authentication',
																values: {
																	public: { value: 'public' },
																	handshake: { value: 'handshake' },
																	strict: { value: 'strict' },
																},
															}),
														},
														path: { type: GraphQLString },
													},
											  })
											: GraphQLBoolean,
									},
									heartbeat: {
										type: toBoolean(env['WEBSOCKETS_HEARTBEAT_ENABLED']) ? GraphQLInt : GraphQLBoolean,
									},
								},
							}),
					  }
					: GraphQLBoolean,
				queryLimit: {
					type: new GraphQLObjectType({
						name: 'server_info_query_limit',
						fields: {
							default: { type: GraphQLInt },
							max: { type: GraphQLInt },
						},
					}),
				},
			});
		}

		/** Globally available query */
		schemaComposer.Query.addFields({
			server_specs_oas: {
				type: GraphQLJSON,
				resolve: async () => {
					const service = new SpecificationService({ schema: this.schema, accountability: this.accountability });
					return await service.oas.generate();
				},
			},
			server_specs_graphql: {
				type: GraphQLString,
				args: {
					scope: new GraphQLEnumType({
						name: 'graphql_sdl_scope',
						values: {
							items: { value: 'items' },
							system: { value: 'system' },
						},
					}),
				},
				resolve: async (_, args) => {
					const service = new GraphQLService({
						schema: this.schema,
						accountability: this.accountability,
						scope: args['scope'] ?? 'items',
					});

					return await service.getSchema('sdl');
				},
			},
			server_ping: {
				type: GraphQLString,
				resolve: () => 'pong',
			},
			server_info: {
				type: ServerInfo,
				resolve: async () => {
					const service = new ServerService({
						accountability: this.accountability,
						schema: this.schema,
					});

					return await service.serverInfo();
				},
			},
			server_health: {
				type: GraphQLJSON,
				resolve: async () => {
					const service = new ServerService({
						accountability: this.accountability,
						schema: this.schema,
					});

					return await service.health();
				},
			},
		});

		const Collection = schemaComposer.createObjectTC({
			name: 'directus_collections',
		});

		const Field = schemaComposer.createObjectTC({
			name: 'directus_fields',
		});

		const Relation = schemaComposer.createObjectTC({
			name: 'directus_relations',
		});

		const Extension = schemaComposer.createObjectTC({
			name: 'directus_extensions',
		});

		/**
		 * Globally available mutations
		 */
		schemaComposer.Mutation.addFields({
			auth_login: {
				type: AuthTokens,
				args: {
					email: new GraphQLNonNull(GraphQLString),
					password: new GraphQLNonNull(GraphQLString),
					mode: AuthMode,
					otp: GraphQLString,
				},
				resolve: async (_, args, { req, res }) => {
					const accountability: Accountability = createDefaultAccountability();

					if (req?.ip) accountability.ip = req.ip;

					const userAgent = req?.get('user-agent');
					if (userAgent) accountability.userAgent = userAgent;

					const origin = req?.get('origin');
					if (origin) accountability.origin = origin;

					const authenticationService = new AuthenticationService({
						accountability: accountability,
						schema: this.schema,
					});

					const mode: AuthenticationMode = args['mode'] ?? 'json';

					const { accessToken, refreshToken, expires } = await authenticationService.login(
						DEFAULT_AUTH_PROVIDER,
						args,
						{
							session: mode === 'session',
							otp: args?.otp,
						},
					);

					const payload = { expires } as { expires: number; access_token?: string; refresh_token?: string };

					if (mode === 'json') {
						payload.refresh_token = refreshToken;
						payload.access_token = accessToken;
					}

					if (mode === 'cookie') {
						res?.cookie(env['REFRESH_TOKEN_COOKIE_NAME'] as string, refreshToken, REFRESH_COOKIE_OPTIONS);
						payload.access_token = accessToken;
					}

					if (mode === 'session') {
						res?.cookie(env['SESSION_COOKIE_NAME'] as string, accessToken, SESSION_COOKIE_OPTIONS);
					}

					return payload;
				},
			},
			auth_refresh: {
				type: AuthTokens,
				args: {
					refresh_token: GraphQLString,
					mode: AuthMode,
				},
				resolve: async (_, args, { req, res }) => {
					const accountability: Accountability = createDefaultAccountability();

					if (req?.ip) accountability.ip = req.ip;

					const userAgent = req?.get('user-agent');
					if (userAgent) accountability.userAgent = userAgent;

					const origin = req?.get('origin');
					if (origin) accountability.origin = origin;

					const authenticationService = new AuthenticationService({
						accountability: accountability,
						schema: this.schema,
					});

					const mode: AuthenticationMode = args['mode'] ?? 'json';
					let currentRefreshToken: string | undefined;

					if (mode === 'json') {
						currentRefreshToken = args['refresh_token'];
					} else if (mode === 'cookie') {
						currentRefreshToken = req?.cookies[env['REFRESH_TOKEN_COOKIE_NAME'] as string];
					} else if (mode === 'session') {
						const token = req?.cookies[env['SESSION_COOKIE_NAME'] as string];

						if (isDirectusJWT(token)) {
							const payload = verifyAccessJWT(token, getSecret());
							currentRefreshToken = payload.session;
						}
					}

					if (!currentRefreshToken) {
						throw new InvalidPayloadError({
							reason: `The refresh token is required in either the payload or cookie`,
						});
					}

					const { accessToken, refreshToken, expires } = await authenticationService.refresh(currentRefreshToken, {
						session: mode === 'session',
					});

					const payload = { expires } as { expires: number; access_token?: string; refresh_token?: string };

					if (mode === 'json') {
						payload.refresh_token = refreshToken;
						payload.access_token = accessToken;
					}

					if (mode === 'cookie') {
						res?.cookie(env['REFRESH_TOKEN_COOKIE_NAME'] as string, refreshToken, REFRESH_COOKIE_OPTIONS);
						payload.access_token = accessToken;
					}

					if (mode === 'session') {
						res?.cookie(env['SESSION_COOKIE_NAME'] as string, accessToken, SESSION_COOKIE_OPTIONS);
					}

					return payload;
				},
			},
			auth_logout: {
				type: GraphQLBoolean,
				args: {
					refresh_token: GraphQLString,
					mode: AuthMode,
				},
				resolve: async (_, args, { req, res }) => {
					const accountability: Accountability = createDefaultAccountability();

					if (req?.ip) accountability.ip = req.ip;

					const userAgent = req?.get('user-agent');
					if (userAgent) accountability.userAgent = userAgent;

					const origin = req?.get('origin');
					if (origin) accountability.origin = origin;

					const authenticationService = new AuthenticationService({
						accountability: accountability,
						schema: this.schema,
					});

					const mode: AuthenticationMode = args['mode'] ?? 'json';
					let currentRefreshToken: string | undefined;

					if (mode === 'json') {
						currentRefreshToken = args['refresh_token'];
					} else if (mode === 'cookie') {
						currentRefreshToken = req?.cookies[env['REFRESH_TOKEN_COOKIE_NAME'] as string];
					} else if (mode === 'session') {
						const token = req?.cookies[env['SESSION_COOKIE_NAME'] as string];

						if (isDirectusJWT(token)) {
							const payload = verifyAccessJWT(token, getSecret());
							currentRefreshToken = payload.session;
						}
					}

					if (!currentRefreshToken) {
						throw new InvalidPayloadError({
							reason: `The refresh token is required in either the payload or cookie`,
						});
					}

					await authenticationService.logout(currentRefreshToken);

					if (req?.cookies[env['REFRESH_TOKEN_COOKIE_NAME'] as string]) {
						res?.clearCookie(env['REFRESH_TOKEN_COOKIE_NAME'] as string, REFRESH_COOKIE_OPTIONS);
					}

					if (req?.cookies[env['SESSION_COOKIE_NAME'] as string]) {
						res?.clearCookie(env['SESSION_COOKIE_NAME'] as string, SESSION_COOKIE_OPTIONS);
					}

					return true;
				},
			},
			auth_password_request: {
				type: GraphQLBoolean,
				args: {
					email: new GraphQLNonNull(GraphQLString),
					reset_url: GraphQLString,
				},
				resolve: async (_, args, { req }) => {
					const accountability: Accountability = createDefaultAccountability();

					if (req?.ip) accountability.ip = req.ip;

					const userAgent = req?.get('user-agent');
					if (userAgent) accountability.userAgent = userAgent;

					const origin = req?.get('origin');
					if (origin) accountability.origin = origin;
					const service = new UsersService({ accountability, schema: this.schema });

					try {
						await service.requestPasswordReset(args['email'], args['reset_url'] || null);
					} catch (err: any) {
						if (isDirectusError(err, ErrorCode.InvalidPayload)) {
							throw err;
						}
					}

					return true;
				},
			},
			auth_password_reset: {
				type: GraphQLBoolean,
				args: {
					token: new GraphQLNonNull(GraphQLString),
					password: new GraphQLNonNull(GraphQLString),
				},
				resolve: async (_, args, { req }) => {
					const accountability: Accountability = createDefaultAccountability();

					if (req?.ip) accountability.ip = req.ip;

					const userAgent = req?.get('user-agent');
					if (userAgent) accountability.userAgent = userAgent;

					const origin = req?.get('origin');
					if (origin) accountability.origin = origin;

					const service = new UsersService({ accountability, schema: this.schema });
					await service.resetPassword(args['token'], args['password']);
					return true;
				},
			},
			users_me_tfa_generate: {
				type: new GraphQLObjectType({
					name: 'users_me_tfa_generate_data',
					fields: {
						secret: { type: GraphQLString },
						otpauth_url: { type: GraphQLString },
					},
				}),
				args: {
					password: new GraphQLNonNull(GraphQLString),
				},
				resolve: async (_, args) => {
					if (!this.accountability?.user) return null;

					const service = new TFAService({
						accountability: this.accountability,
						schema: this.schema,
					});

					const authService = new AuthenticationService({
						accountability: this.accountability,
						schema: this.schema,
					});

					await authService.verifyPassword(this.accountability.user, args['password']);
					const { url, secret } = await service.generateTFA(this.accountability.user);
					return { secret, otpauth_url: url };
				},
			},
			users_me_tfa_enable: {
				type: GraphQLBoolean,
				args: {
					otp: new GraphQLNonNull(GraphQLString),
					secret: new GraphQLNonNull(GraphQLString),
				},
				resolve: async (_, args) => {
					if (!this.accountability?.user) return null;

					const service = new TFAService({
						accountability: this.accountability,
						schema: this.schema,
					});

					await service.enableTFA(this.accountability.user, args['otp'], args['secret']);
					return true;
				},
			},
			users_me_tfa_disable: {
				type: GraphQLBoolean,
				args: {
					otp: new GraphQLNonNull(GraphQLString),
				},
				resolve: async (_, args) => {
					if (!this.accountability?.user) return null;

					const service = new TFAService({
						accountability: this.accountability,
						schema: this.schema,
					});

					const otpValid = await service.verifyOTP(this.accountability.user, args['otp']);

					if (otpValid === false) {
						throw new InvalidPayloadError({ reason: `"otp" is invalid` });
					}

					await service.disableTFA(this.accountability.user);
					return true;
				},
			},
			utils_random_string: {
				type: GraphQLString,
				args: {
					length: GraphQLInt,
				},
				resolve: async (_, args) => {
					const { nanoid } = await import('nanoid');

					if (args['length'] !== undefined && (args['length'] < 1 || args['length'] > 500)) {
						throw new InvalidPayloadError({ reason: `"length" must be between 1 and 500` });
					}

					return nanoid(args['length'] ? args['length'] : 32);
				},
			},
			utils_hash_generate: {
				type: GraphQLString,
				args: {
					string: new GraphQLNonNull(GraphQLString),
				},
				resolve: async (_, args) => {
					return await generateHash(args['string']);
				},
			},
			utils_hash_verify: {
				type: GraphQLBoolean,
				args: {
					string: new GraphQLNonNull(GraphQLString),
					hash: new GraphQLNonNull(GraphQLString),
				},
				resolve: async (_, args) => {
					return await argon2.verify(args['hash'], args['string']);
				},
			},
			utils_sort: {
				type: GraphQLBoolean,
				args: {
					collection: new GraphQLNonNull(GraphQLString),
					item: new GraphQLNonNull(GraphQLID),
					to: new GraphQLNonNull(GraphQLID),
				},
				resolve: async (_, args) => {
					const service = new UtilsService({
						accountability: this.accountability,
						schema: this.schema,
					});

					const { item, to } = args;
					await service.sort(args['collection'], { item, to });
					return true;
				},
			},
			utils_revert: {
				type: GraphQLBoolean,
				args: {
					revision: new GraphQLNonNull(GraphQLID),
				},
				resolve: async (_, args) => {
					const service = new RevisionsService({
						accountability: this.accountability,
						schema: this.schema,
					});

					await service.revert(args['revision']);
					return true;
				},
			},
			utils_cache_clear: {
				type: GraphQLVoid,
				resolve: async () => {
					if (this.accountability?.admin !== true) {
						throw new ForbiddenError();
					}

					const { cache } = getCache();

					await cache?.clear();
					await clearSystemCache();

					return;
				},
			},
			users_invite_accept: {
				type: GraphQLBoolean,
				args: {
					token: new GraphQLNonNull(GraphQLString),
					password: new GraphQLNonNull(GraphQLString),
				},
				resolve: async (_, args) => {
					const service = new UsersService({
						accountability: this.accountability,
						schema: this.schema,
					});

					await service.acceptInvite(args['token'], args['password']);
					return true;
				},
			},
			users_register: {
				type: GraphQLBoolean,
				args: {
					email: new GraphQLNonNull(GraphQLString),
					password: new GraphQLNonNull(GraphQLString),
					verification_url: GraphQLString,
					first_name: GraphQLString,
					last_name: GraphQLString,
				},
				resolve: async (_, args, { req }) => {
					const service = new UsersService({ accountability: null, schema: this.schema });

					const ip = req ? getIPFromReq(req) : null;

					if (ip) {
						await rateLimiter.consume(ip);
					}

					await service.registerUser({
						email: args.email,
						password: args.password,
						verification_url: args.verification_url,
						first_name: args.first_name,
						last_name: args.last_name,
					});

					return true;
				},
			},
			users_register_verify: {
				type: GraphQLBoolean,
				args: {
					token: new GraphQLNonNull(GraphQLString),
				},
				resolve: async (_, args) => {
					const service = new UsersService({ accountability: null, schema: this.schema });
					await service.verifyRegistration(args.token);
					return true;
				},
			},
		});

		if ('directus_collections' in schema.read.collections) {
			Collection.addFields({
				collection: GraphQLString,
				meta: schemaComposer.createObjectTC({
					name: 'directus_collections_meta',
					fields: Object.values(schema.read.collections['directus_collections']!.fields).reduce(
						(acc, field) => {
							acc[field.field] = {
								type: field.nullable
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
					name: 'directus_collections_schema',
					fields: {
						name: GraphQLString,
						comment: GraphQLString,
					},
				}),
			});

			schemaComposer.Query.addFields({
				collections: {
					type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Collection.getType()))),
					resolve: async () => {
						const collectionsService = new CollectionsService({
							accountability: this.accountability,
							schema: this.schema,
						});

						return await collectionsService.readByQuery();
					},
				},

				collections_by_name: {
					type: Collection,
					args: {
						name: new GraphQLNonNull(GraphQLString),
					},
					resolve: async (_, args) => {
						const collectionsService = new CollectionsService({
							accountability: this.accountability,
							schema: this.schema,
						});

						return await collectionsService.readOne(args['name']);
					},
				},
			});
		}

		if ('directus_fields' in schema.read.collections) {
			Field.addFields({
				collection: GraphQLString,
				field: GraphQLString,
				type: GraphQLString,
				meta: schemaComposer.createObjectTC({
					name: 'directus_fields_meta',
					fields: Object.values(schema.read.collections['directus_fields']!.fields).reduce(
						(acc, field) => {
							acc[field.field] = {
								type: field.nullable
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
					name: 'directus_fields_schema',
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

			schemaComposer.Query.addFields({
				fields: {
					type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Field.getType()))),
					resolve: async () => {
						const service = new FieldsService({
							accountability: this.accountability,
							schema: this.schema,
						});

						return await service.readAll();
					},
				},
				fields_in_collection: {
					type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Field.getType()))),
					args: {
						collection: new GraphQLNonNull(GraphQLString),
					},
					resolve: async (_, args) => {
						const service = new FieldsService({
							accountability: this.accountability,
							schema: this.schema,
						});

						return await service.readAll(args['collection']);
					},
				},
				fields_by_name: {
					type: Field,
					args: {
						collection: new GraphQLNonNull(GraphQLString),
						field: new GraphQLNonNull(GraphQLString),
					},
					resolve: async (_, args) => {
						const service = new FieldsService({
							accountability: this.accountability,
							schema: this.schema,
						});

						return await service.readOne(args['collection'], args['field']);
					},
				},
			});
		}

		if ('directus_relations' in schema.read.collections) {
			Relation.addFields({
				collection: GraphQLString,
				field: GraphQLString,
				related_collection: GraphQLString,
				schema: schemaComposer.createObjectTC({
					name: 'directus_relations_schema',
					fields: {
						table: new GraphQLNonNull(GraphQLString),
						column: new GraphQLNonNull(GraphQLString),
						foreign_key_table: new GraphQLNonNull(GraphQLString),
						foreign_key_column: new GraphQLNonNull(GraphQLString),
						constraint_name: GraphQLString,
						on_update: new GraphQLNonNull(GraphQLString),
						on_delete: new GraphQLNonNull(GraphQLString),
					},
				}),
				meta: schemaComposer.createObjectTC({
					name: 'directus_relations_meta',
					fields: Object.values(schema.read.collections['directus_relations']!.fields).reduce(
						(acc, field) => {
							acc[field.field] = {
								type: getGraphQLType(field.type, field.special),
								description: field.note,
							} as ObjectTypeComposerFieldConfigDefinition<any, any, any>;

							return acc;
						},
						{} as ObjectTypeComposerFieldConfigAsObjectDefinition<any, any>,
					),
				}),
			});

			schemaComposer.Query.addFields({
				relations: {
					type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Relation.getType()))),
					resolve: async () => {
						const service = new RelationsService({
							accountability: this.accountability,
							schema: this.schema,
						});

						return await service.readAll();
					},
				},
				relations_in_collection: {
					type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Relation.getType()))),
					args: {
						collection: new GraphQLNonNull(GraphQLString),
					},
					resolve: async (_, args) => {
						const service = new RelationsService({
							accountability: this.accountability,
							schema: this.schema,
						});

						return await service.readAll(args['collection']);
					},
				},
				relations_by_name: {
					type: Relation,
					args: {
						collection: new GraphQLNonNull(GraphQLString),
						field: new GraphQLNonNull(GraphQLString),
					},
					resolve: async (_, args) => {
						const service = new RelationsService({
							accountability: this.accountability,
							schema: this.schema,
						});

						return await service.readOne(args['collection'], args['field']);
					},
				},
			});
		}

		if (this.accountability?.admin === true) {
			schemaComposer.Mutation.addFields({
				create_collections_item: {
					type: Collection,
					args: {
						data: toInputObjectType(Collection.clone('create_directus_collections'), {
							postfix: '_input',
						}).addFields({
							fields: [
								toInputObjectType(Field.clone('create_directus_collections_fields'), { postfix: '_input' }).NonNull,
							],
						}).NonNull,
					},
					resolve: async (_, args) => {
						const collectionsService = new CollectionsService({
							accountability: this.accountability,
							schema: this.schema,
						});

						const collectionKey = await collectionsService.createOne(args['data']);
						return await collectionsService.readOne(collectionKey);
					},
				},
				update_collections_item: {
					type: Collection,
					args: {
						collection: new GraphQLNonNull(GraphQLString),
						data: toInputObjectType(Collection.clone('update_directus_collections'), {
							postfix: '_input',
						}).removeField(['collection', 'schema']).NonNull,
					},
					resolve: async (_, args) => {
						const collectionsService = new CollectionsService({
							accountability: this.accountability,
							schema: this.schema,
						});

						const collectionKey = await collectionsService.updateOne(args['collection'], args['data']);
						return await collectionsService.readOne(collectionKey);
					},
				},
				delete_collections_item: {
					type: schemaComposer.createObjectTC({
						name: 'delete_collection',
						fields: {
							collection: GraphQLString,
						},
					}),
					args: {
						collection: new GraphQLNonNull(GraphQLString),
					},
					resolve: async (_, args) => {
						const collectionsService = new CollectionsService({
							accountability: this.accountability,
							schema: this.schema,
						});

						await collectionsService.deleteOne(args['collection']);
						return { collection: args['collection'] };
					},
				},
			});

			schemaComposer.Mutation.addFields({
				create_fields_item: {
					type: Field,
					args: {
						collection: new GraphQLNonNull(GraphQLString),
						data: toInputObjectType(Field.clone('create_directus_fields'), { postfix: '_input' }).NonNull,
					},
					resolve: async (_, args) => {
						const service = new FieldsService({
							accountability: this.accountability,
							schema: this.schema,
						});

						await service.createField(args['collection'], args['data']);
						return await service.readOne(args['collection'], args['data'].field);
					},
				},
				update_fields_item: {
					type: Field,
					args: {
						collection: new GraphQLNonNull(GraphQLString),
						field: new GraphQLNonNull(GraphQLString),
						data: toInputObjectType(Field.clone('update_directus_fields'), { postfix: '_input' }).NonNull,
					},
					resolve: async (_, args) => {
						const service = new FieldsService({
							accountability: this.accountability,
							schema: this.schema,
						});

						await service.updateField(args['collection'], {
							...args['data'],
							field: args['field'],
						});

						return await service.readOne(args['collection'], args['data'].field);
					},
				},
				delete_fields_item: {
					type: schemaComposer.createObjectTC({
						name: 'delete_field',
						fields: {
							collection: GraphQLString,
							field: GraphQLString,
						},
					}),
					args: {
						collection: new GraphQLNonNull(GraphQLString),
						field: new GraphQLNonNull(GraphQLString),
					},
					resolve: async (_, args) => {
						const service = new FieldsService({
							accountability: this.accountability,
							schema: this.schema,
						});

						await service.deleteField(args['collection'], args['field']);
						const { collection, field } = args;
						return { collection, field };
					},
				},
			});

			schemaComposer.Mutation.addFields({
				create_relations_item: {
					type: Relation,
					args: {
						data: toInputObjectType(Relation.clone('create_directus_relations'), { postfix: '_input' }).NonNull,
					},
					resolve: async (_, args) => {
						const relationsService = new RelationsService({
							accountability: this.accountability,
							schema: this.schema,
						});

						await relationsService.createOne(args['data']);
						return await relationsService.readOne(args['data'].collection, args['data'].field);
					},
				},
				update_relations_item: {
					type: Relation,
					args: {
						collection: new GraphQLNonNull(GraphQLString),
						field: new GraphQLNonNull(GraphQLString),
						data: toInputObjectType(Relation.clone('update_directus_relations'), { postfix: '_input' }).NonNull,
					},
					resolve: async (_, args) => {
						const relationsService = new RelationsService({
							accountability: this.accountability,
							schema: this.schema,
						});

						await relationsService.updateOne(args['collection'], args['field'], args['data']);
						return await relationsService.readOne(args['data'].collection, args['data'].field);
					},
				},
				delete_relations_item: {
					type: schemaComposer.createObjectTC({
						name: 'delete_relation',
						fields: {
							collection: GraphQLString,
							field: GraphQLString,
						},
					}),
					args: {
						collection: new GraphQLNonNull(GraphQLString),
						field: new GraphQLNonNull(GraphQLString),
					},
					resolve: async (_, args) => {
						const relationsService = new RelationsService({
							accountability: this.accountability,
							schema: this.schema,
						});

						await relationsService.deleteOne(args['collection'], args['field']);
						return { collection: args['collection'], field: args['field'] };
					},
				},
			});

			Extension.addFields({
				bundle: GraphQLString,
				name: new GraphQLNonNull(GraphQLString),
				schema: schemaComposer.createObjectTC({
					name: 'directus_extensions_schema',
					fields: {
						type: GraphQLString,
						local: GraphQLBoolean,
					},
				}),
				meta: schemaComposer.createObjectTC({
					name: 'directus_extensions_meta',
					fields: {
						enabled: GraphQLBoolean,
					},
				}),
			});

			schemaComposer.Query.addFields({
				extensions: {
					type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(Extension.getType()))),
					resolve: async () => {
						const service = new ExtensionsService({
							accountability: this.accountability,
							schema: this.schema,
						});

						return await service.readAll();
					},
				},
			});

			schemaComposer.Mutation.addFields({
				update_extensions_item: {
					type: Extension,
					args: {
						id: GraphQLID,
						data: toInputObjectType(
							schemaComposer.createObjectTC({
								name: 'update_directus_extensions_input',
								fields: {
									meta: schemaComposer.createObjectTC({
										name: 'update_directus_extensions_input_meta',
										fields: {
											enabled: GraphQLBoolean,
										},
									}),
								},
							}),
						),
					},
					resolve: async (_, args) => {
						const extensionsService = new ExtensionsService({
							accountability: this.accountability,
							schema: this.schema,
						});

						await extensionsService.updateOne(args['id'], args['data']);
						return await extensionsService.readOne(args['id']);
					},
				},
			});
		}

		if ('directus_users' in schema.read.collections) {
			schemaComposer.Query.addFields({
				users_me: {
					type: ReadCollectionTypes['directus_users']!,
					resolve: async (_, args, __, info) => {
						if (!this.accountability?.user) return null;
						const service = new UsersService({ schema: this.schema, accountability: this.accountability });

						const selections = this.replaceFragmentsInSelections(
							info.fieldNodes[0]?.selectionSet?.selections,
							info.fragments,
						);

						const query = this.getQuery(args, selections || [], info.variableValues);

						return await service.readOne(this.accountability.user, query);
					},
				},
			});
		}

		if ('directus_permissions' in schema.read.collections) {
			schemaComposer.Query.addFields({
				permissions_me: {
					type: schemaComposer.createScalarTC<CollectionAccess>({
						name: 'permissions_me_type',
						parseValue: (value: unknown) => value as CollectionAccess,
						serialize: (value) => value,
					}),
					resolve: async (_, _args, __, _info) => {
						if (!this.accountability?.user && !this.accountability?.role) return null;

						const result = await fetchAccountabilityCollectionAccess(this.accountability, {
							schema: this.schema,
							knex: getDatabase(),
						});

						return result;
					},
				},
			});
		}

		if ('directus_roles' in schema.read.collections) {
			schemaComposer.Query.addFields({
				roles_me: {
					type: ReadCollectionTypes['directus_roles']!.List,
					resolve: async (_, args, __, info) => {
						if (!this.accountability?.user && !this.accountability?.role) return null;

						const service = new RolesService({
							accountability: this.accountability,
							schema: this.schema,
						});

						const selections = this.replaceFragmentsInSelections(
							info.fieldNodes[0]?.selectionSet?.selections,
							info.fragments,
						);

						const query = this.getQuery(args, selections || [], info.variableValues);
						query.limit = -1;

						const roles = await service.readMany(this.accountability.roles, query);

						return roles;
					},
				},
			});
		}

		if ('directus_policies' in schema.read.collections) {
			schemaComposer.Query.addFields({
				policies_me_globals: {
					type: schemaComposer.createObjectTC({
						name: 'policy_me_globals_type',
						fields: {
							enforce_tfa: 'Boolean',
							app_access: 'Boolean',
							admin_access: 'Boolean',
						},
					}),
					resolve: async (_, _args, __, _info) => {
						if (!this.accountability?.user && !this.accountability?.role) return null;

						const result = await fetchAccountabilityPolicyGlobals(this.accountability, {
							schema: this.schema,
							knex: getDatabase(),
						});

						return result;
					},
				},
			});
		}

		if ('directus_users' in schema.update.collections && this.accountability?.user) {
			schemaComposer.Mutation.addFields({
				update_users_me: {
					type: ReadCollectionTypes['directus_users']!,
					args: {
						data: toInputObjectType(UpdateCollectionTypes['directus_users']!),
					},
					resolve: async (_, args, __, info) => {
						if (!this.accountability?.user) return null;

						const service = new UsersService({
							schema: this.schema,
							accountability: this.accountability,
						});

						await service.updateOne(this.accountability.user, args['data']);

						if ('directus_users' in ReadCollectionTypes) {
							const selections = this.replaceFragmentsInSelections(
								info.fieldNodes[0]?.selectionSet?.selections,
								info.fragments,
							);

							const query = this.getQuery(args, selections || [], info.variableValues);

							return await service.readOne(this.accountability.user, query);
						}

						return true;
					},
				},
			});
		}

		if ('directus_files' in schema.create.collections) {
			schemaComposer.Mutation.addFields({
				import_file: {
					type: ReadCollectionTypes['directus_files'] ?? GraphQLBoolean,
					args: {
						url: new GraphQLNonNull(GraphQLString),
						data: toInputObjectType(CreateCollectionTypes['directus_files']!).setTypeName(
							'create_directus_files_input',
						),
					},
					resolve: async (_, args, __, info) => {
						const service = new FilesService({
							accountability: this.accountability,
							schema: this.schema,
						});

						const primaryKey = await service.importOne(args['url'], args['data']);

						if ('directus_files' in ReadCollectionTypes) {
							const selections = this.replaceFragmentsInSelections(
								info.fieldNodes[0]?.selectionSet?.selections,
								info.fragments,
							);

							const query = this.getQuery(args, selections || [], info.variableValues);
							return await service.readOne(primaryKey, query);
						}

						return true;
					},
				},
			});
		}

		if ('directus_users' in schema.create.collections) {
			schemaComposer.Mutation.addFields({
				users_invite: {
					type: GraphQLBoolean,
					args: {
						email: new GraphQLNonNull(GraphQLString),
						role: new GraphQLNonNull(GraphQLString),
						invite_url: GraphQLString,
					},
					resolve: async (_, args) => {
						const service = new UsersService({
							accountability: this.accountability,
							schema: this.schema,
						});

						await service.inviteUser(args['email'], args['role'], args['invite_url'] || null);
						return true;
					},
				},
			});
		}

		return schemaComposer;
	}
}
