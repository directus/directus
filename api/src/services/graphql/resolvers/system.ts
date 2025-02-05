import { useEnv } from '@directus/env';
import type { CollectionAccess } from '@directus/types';
import { toBoolean } from '@directus/utils';
import {
	GraphQLBoolean,
	GraphQLEnumType,
	GraphQLInt,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLString,
} from 'graphql';
import type {
	ObjectTypeComposerFieldConfigAsObjectDefinition,
	ObjectTypeComposerFieldConfigDefinition,
} from 'graphql-compose';
import { GraphQLJSON, ObjectTypeComposer, SchemaComposer, toInputObjectType } from 'graphql-compose';
import getDatabase from '../../../database/index.js';
import { fetchAccountabilityCollectionAccess } from '../../../permissions/modules/fetch-accountability-collection-access/fetch-accountability-collection-access.js';
import { fetchAccountabilityPolicyGlobals } from '../../../permissions/modules/fetch-accountability-policy-globals/fetch-accountability-policy-globals.js';
import type { GraphQLParams } from '../../../types/index.js';
import { getGraphQLType } from '../../../utils/get-graphql-type.js';
import { CollectionsService } from '../../collections.js';
import { FieldsService } from '../../fields.js';
import { FilesService } from '../../files.js';
import { RelationsService } from '../../relations.js';
import { RolesService } from '../../roles.js';
import { ServerService } from '../../server.js';
import { SpecificationService } from '../../specifications.js';
import { UsersService } from '../../users.js';
import { GraphQLService } from '../index.js';
import { generateSchema, type CollectionTypes, type Schema } from '../schema/index.js';
import { getQuery } from '../schema/parse-query.js';
import { replaceFragmentsInSelections } from '../utils/replace-fragments.js';
import { resolveSystemAdmin } from './system-admin.js';
import { globalResolvers } from './system-global.js';

const env = useEnv();

export type BaseTypeComposers = {
	Collection: ObjectTypeComposer<any, any>;
	Field: ObjectTypeComposer<any, any>;
	Relation: ObjectTypeComposer<any, any>;
	Extension: ObjectTypeComposer<any, any>;
};

export function injectSystemResolvers(
	gql: GraphQLService,
	schemaComposer: SchemaComposer<GraphQLParams['contextValue']>,
	{ CreateCollectionTypes, ReadCollectionTypes, UpdateCollectionTypes }: CollectionTypes,
	schema: Schema,
): SchemaComposer<any> {
	globalResolvers(gql, schemaComposer);

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

	if (gql.accountability?.user) {
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
				const service = new SpecificationService({ schema: gql.schema, accountability: gql.accountability });
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
					schema: gql.schema,
					accountability: gql.accountability,
					scope: args['scope'] ?? 'items',
				});

				return await generateSchema(service, 'sdl');
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
					accountability: gql.accountability,
					schema: gql.schema,
				});

				return await service.serverInfo();
			},
		},
		server_health: {
			type: GraphQLJSON,
			resolve: async () => {
				const service = new ServerService({
					accountability: gql.accountability,
					schema: gql.schema,
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

	const composers: BaseTypeComposers = {
		Collection,
		Field,
		Relation,
		Extension,
	};

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
						accountability: gql.accountability,
						schema: gql.schema,
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
						accountability: gql.accountability,
						schema: gql.schema,
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
						accountability: gql.accountability,
						schema: gql.schema,
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
						accountability: gql.accountability,
						schema: gql.schema,
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
						accountability: gql.accountability,
						schema: gql.schema,
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
						accountability: gql.accountability,
						schema: gql.schema,
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
						accountability: gql.accountability,
						schema: gql.schema,
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
						accountability: gql.accountability,
						schema: gql.schema,
					});

					return await service.readOne(args['collection'], args['field']);
				},
			},
		});
	}

	resolveSystemAdmin(gql, schemaComposer, composers);

	if ('directus_users' in schema.read.collections) {
		schemaComposer.Query.addFields({
			users_me: {
				type: ReadCollectionTypes['directus_users']!,
				resolve: async (_, args, __, info) => {
					if (!gql.accountability?.user) return null;
					const service = new UsersService({ schema: gql.schema, accountability: gql.accountability });

					const selections = replaceFragmentsInSelections(info.fieldNodes[0]?.selectionSet?.selections, info.fragments);

					const query = getQuery(args, selections || [], info.variableValues, gql.accountability);

					return await service.readOne(gql.accountability.user, query);
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
					if (!gql.accountability?.user && !gql.accountability?.role) return null;

					const result = await fetchAccountabilityCollectionAccess(gql.accountability, {
						schema: gql.schema,
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
					if (!gql.accountability?.user && !gql.accountability?.role) return null;

					const service = new RolesService({
						accountability: gql.accountability,
						schema: gql.schema,
					});

					const selections = replaceFragmentsInSelections(info.fieldNodes[0]?.selectionSet?.selections, info.fragments);

					const query = getQuery(args, selections || [], info.variableValues, gql.accountability);
					query.limit = -1;

					const roles = await service.readMany(gql.accountability.roles, query);

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
					if (!gql.accountability?.user && !gql.accountability?.role) return null;

					const result = await fetchAccountabilityPolicyGlobals(gql.accountability, {
						schema: gql.schema,
						knex: getDatabase(),
					});

					return result;
				},
			},
		});
	}

	if ('directus_users' in schema.update.collections && gql.accountability?.user) {
		schemaComposer.Mutation.addFields({
			update_users_me: {
				type: ReadCollectionTypes['directus_users']!,
				args: {
					data: toInputObjectType(UpdateCollectionTypes['directus_users']!),
				},
				resolve: async (_, args, __, info) => {
					if (!gql.accountability?.user) return null;

					const service = new UsersService({
						schema: gql.schema,
						accountability: gql.accountability,
					});

					await service.updateOne(gql.accountability.user, args['data']);

					if ('directus_users' in ReadCollectionTypes) {
						const selections = replaceFragmentsInSelections(
							info.fieldNodes[0]?.selectionSet?.selections,
							info.fragments,
						);

						const query = getQuery(args, selections || [], info.variableValues, gql.accountability);

						return await service.readOne(gql.accountability.user, query);
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
					data: toInputObjectType(CreateCollectionTypes['directus_files']!).setTypeName('create_directus_files_input'),
				},
				resolve: async (_, args, __, info) => {
					const service = new FilesService({
						accountability: gql.accountability,
						schema: gql.schema,
					});

					const primaryKey = await service.importOne(args['url'], args['data']);

					if ('directus_files' in ReadCollectionTypes) {
						const selections = replaceFragmentsInSelections(
							info.fieldNodes[0]?.selectionSet?.selections,
							info.fragments,
						);

						const query = getQuery(args, selections || [], info.variableValues, gql.accountability);
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
						accountability: gql.accountability,
						schema: gql.schema,
					});

					await service.inviteUser(args['email'], args['role'], args['invite_url'] || null);
					return true;
				},
			},
		});
	}

	return schemaComposer;
}
