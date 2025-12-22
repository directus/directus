import { useEnv } from '@directus/env';
import formatTitle from '@directus/format-title';
import { spec } from '@directus/specs';
import { isSystemCollection } from '@directus/system-data';
import type {
	AbstractServiceOptions,
	Accountability,
	FieldOverview,
	Permission,
	SchemaOverview,
	Type,
} from '@directus/types';
import { getRelation } from '@directus/utils';
import type { Knex } from 'knex';
import { cloneDeep, mergeWith } from 'lodash-es';
import hash from 'object-hash';
import type {
	OpenAPIObject,
	ParameterObject,
	PathItemObject,
	ReferenceObject,
	SchemaObject,
	TagObject,
} from 'openapi3-ts/oas30';
import { OAS_REQUIRED_SCHEMAS } from '../constants.js';
import getDatabase from '../database/index.js';
import { fetchPermissions } from '../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../permissions/lib/fetch-policies.js';
import { fetchAllowedFieldMap } from '../permissions/modules/fetch-allowed-field-map/fetch-allowed-field-map.js';
import { getRelationType } from '../utils/get-relation-type.js';
import { reduceSchema } from '../utils/reduce-schema.js';
import { GraphQLService } from './graphql/index.js';

const env = useEnv();

export class SpecificationService {
	accountability: Accountability | null;
	knex: Knex;
	schema: SchemaOverview;

	oas: OASSpecsService;
	graphql: GraphQLSpecsService;

	constructor(options: AbstractServiceOptions) {
		this.accountability = options.accountability || null;
		this.knex = options.knex || getDatabase();
		this.schema = options.schema;

		this.oas = new OASSpecsService(options);
		this.graphql = new GraphQLSpecsService(options);
	}
}

interface SpecificationSubService {
	generate: (_?: any) => Promise<any>;
}

class OASSpecsService implements SpecificationSubService {
	accountability: Accountability | null;
	knex: Knex;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.accountability = options.accountability || null;
		this.knex = options.knex || getDatabase();

		this.schema = options.schema;
	}

	async generate(host?: string) {
		let schemaForSpec = this.schema;
		let permissions: Permission[] = [];

		if (this.accountability && this.accountability.admin !== true) {
			const allowedFields = await fetchAllowedFieldMap(
				{
					accountability: this.accountability,
					action: 'read',
				},
				{ schema: this.schema, knex: this.knex },
			);

			schemaForSpec = reduceSchema(this.schema, allowedFields);

			const policies = await fetchPolicies(this.accountability, { schema: this.schema, knex: this.knex });

			permissions = await fetchPermissions(
				{ policies, accountability: this.accountability },
				{ schema: this.schema, knex: this.knex },
			);
		}

		const tags = await this.generateTags(schemaForSpec);
		const paths = await this.generatePaths(schemaForSpec, permissions, tags);
		const components = await this.generateComponents(schemaForSpec, tags);

		const isDefaultPublicUrl = env['PUBLIC_URL'] === '/';
		const url = isDefaultPublicUrl && host ? host : (env['PUBLIC_URL'] as string);

		const hashedVersion = hash({
			now: new Date().toISOString(),
			user: this.accountability?.user,
		});

		const spec: OpenAPIObject = {
			openapi: '3.0.1',
			info: {
				title: 'Dynamic API Specification',
				description:
					'This is a dynamically generated API specification for all endpoints existing on the current project.',
				version: hashedVersion,
			},
			servers: [
				{
					url,
					description: 'Your current Directus instance.',
				},
			],
			paths,
		};

		if (tags) spec.tags = tags;
		if (components) spec.components = components;

		return spec;
	}

	private async generateTags(schema: SchemaOverview): Promise<OpenAPIObject['tags']> {
		const systemTags = cloneDeep(spec.tags)!;

		const collections = Object.values(schema.collections);
		const tags: OpenAPIObject['tags'] = [];

		for (const systemTag of systemTags) {
			// Check if necessary authentication level is given
			if (systemTag['x-authentication'] === 'admin' && !this.accountability?.admin) continue;
			if (systemTag['x-authentication'] === 'user' && !this.accountability?.user) continue;

			// Remaining system tags that don't have an associated collection are publicly available
			if (!systemTag['x-collection']) {
				tags.push(systemTag);
			}
		}

		for (const collection of collections) {
			const isSystem = isSystemCollection(collection.collection);

			// If the collection is one of the system collections, pull the tag from the static spec
			if (isSystem) {
				for (const tag of spec.tags!) {
					if (tag['x-collection'] === collection.collection) {
						tags.push(tag);
						break;
					}
				}
			} else {
				const tag: TagObject = {
					name: 'Items' + formatTitle(collection.collection).replace(/ /g, ''),
					'x-collection': collection.collection,
				};

				if (collection.note) {
					tag.description = collection.note;
				}

				tags.push(tag);
			}
		}

		// Filter out the generic Items information
		return tags.filter((tag) => tag.name !== 'Items');
	}

	private async generatePaths(
		schema: SchemaOverview,
		permissions: Permission[],
		tags: OpenAPIObject['tags'],
	): Promise<OpenAPIObject['paths']> {
		const paths: OpenAPIObject['paths'] = {};

		if (!tags) return paths;

		for (const tag of tags) {
			const isSystem = 'x-collection' in tag === false || isSystemCollection(tag['x-collection']);

			if (isSystem) {
				for (const [path, pathItem] of Object.entries<PathItemObject>(spec.paths)) {
					for (const [method, operation] of Object.entries(pathItem)) {
						if (operation.tags?.includes(tag.name)) {
							if (!paths[path]) {
								paths[path] = {};
							}

							const hasPermission =
								this.accountability?.admin === true ||
								'x-collection' in tag === false ||
								!!permissions.find(
									(permission) =>
										permission.collection === tag['x-collection'] &&
										permission.action === this.getActionForMethod(method),
								);

							if (hasPermission) {
								if ('parameters' in pathItem) {
									paths[path]![method as keyof PathItemObject] = {
										...operation,
										parameters: [...(pathItem.parameters ?? []), ...(operation?.parameters ?? [])],
									};
								} else {
									paths[path]![method as keyof PathItemObject] = operation;
								}
							}
						}
					}
				}
			} else {
				const listBase = cloneDeep(spec.paths['/items/{collection}']);
				const detailBase = cloneDeep(spec.paths['/items/{collection}/{id}']);
				const collection = tag['x-collection'];

				const methods: (keyof PathItemObject)[] = ['post', 'get', 'patch', 'delete'];

				for (const method of methods) {
					const hasPermission =
						this.accountability?.admin === true ||
						!!permissions.find(
							(permission) =>
								permission.collection === collection && permission.action === this.getActionForMethod(method),
						);

					if (hasPermission) {
						if (!paths[`/items/${collection}`]) paths[`/items/${collection}`] = {};
						if (!paths[`/items/${collection}/{id}`]) paths[`/items/${collection}/{id}`] = {};

						if (listBase?.[method]) {
							paths[`/items/${collection}`]![method] = mergeWith(
								cloneDeep(listBase[method]),
								{
									description: listBase[method].description.replace('item', collection + ' item'),
									tags: [tag.name],
									parameters: 'parameters' in listBase ? this.filterCollectionFromParams(listBase.parameters) : [],
									operationId: `${this.getActionForMethod(method)}${tag.name}`,
									requestBody: ['get', 'delete'].includes(method)
										? undefined
										: {
												content: {
													'application/json': {
														schema: {
															oneOf: [
																{
																	type: 'array',
																	items: {
																		$ref: `#/components/schemas/${tag.name}`,
																	},
																},
																{
																	$ref: `#/components/schemas/${tag.name}`,
																},
															],
														},
													},
												},
											},
									responses: {
										'200': {
											description: 'Successful request',
											content:
												method === 'delete'
													? undefined
													: {
															'application/json': {
																schema: {
																	properties: {
																		data: schema.collections[collection]?.singleton
																			? {
																					$ref: `#/components/schemas/${tag.name}`,
																				}
																			: {
																					type: 'array',
																					items: {
																						$ref: `#/components/schemas/${tag.name}`,
																					},
																				},
																	},
																},
															},
														},
										},
									},
								},
								(obj, src) => {
									if (Array.isArray(obj)) return obj.concat(src);
									return undefined;
								},
							);
						}

						if (detailBase?.[method]) {
							paths[`/items/${collection}/{id}`]![method] = mergeWith(
								cloneDeep(detailBase[method]),
								{
									description: detailBase[method].description.replace('item', collection + ' item'),
									tags: [tag.name],
									operationId: `${this.getActionForMethod(method)}Single${tag.name}`,
									parameters: 'parameters' in detailBase ? this.filterCollectionFromParams(detailBase.parameters) : [],
									requestBody: ['get', 'delete'].includes(method)
										? undefined
										: {
												content: {
													'application/json': {
														schema: {
															$ref: `#/components/schemas/${tag.name}`,
														},
													},
												},
											},
									responses: {
										'200': {
											content:
												method === 'delete'
													? undefined
													: {
															'application/json': {
																schema: {
																	properties: {
																		data: {
																			$ref: `#/components/schemas/${tag.name}`,
																		},
																	},
																},
															},
														},
										},
									},
								},
								(obj, src) => {
									if (Array.isArray(obj)) return obj.concat(src);
									return undefined;
								},
							);
						}
					}
				}
			}
		}

		return paths;
	}

	private async generateComponents(
		schema: SchemaOverview,
		tags: OpenAPIObject['tags'],
	): Promise<OpenAPIObject['components']> {
		if (!tags) return;

		let components: OpenAPIObject['components'] = cloneDeep(spec.components);

		if (!components) components = {};

		components.schemas = {};

		const tagSchemas = tags.reduce(
			(schemas, tag) => [...schemas, ...(tag['x-schemas'] ? tag['x-schemas'] : [])],
			[] as string[],
		);

		const requiredSchemas = [...OAS_REQUIRED_SCHEMAS, ...tagSchemas];

		for (const [name, schema] of Object.entries(spec.components?.schemas ?? {})) {
			if (requiredSchemas.includes(name)) {
				const collection = spec.tags?.find((tag) => tag.name === name)?.['x-collection'];

				components.schemas[name] = {
					...cloneDeep(schema),
					...(collection && { 'x-collection': collection }),
				};
			}
		}

		const collections = Object.values(schema.collections);

		for (const collection of collections) {
			const tag = tags.find((tag) => tag['x-collection'] === collection.collection);

			if (!tag) continue;

			const isSystem = isSystemCollection(collection.collection);

			const fieldsInCollection = Object.values(collection.fields);

			if (isSystem) {
				const schemaComponent = cloneDeep(spec.components!.schemas![tag.name]) as SchemaObject;

				schemaComponent.properties = {};
				schemaComponent['x-collection'] = collection.collection;

				for (const field of fieldsInCollection) {
					schemaComponent.properties[field.field] =
						(cloneDeep(
							(spec.components!.schemas![tag.name] as SchemaObject).properties![field.field],
						) as SchemaObject) || this.generateField(schema, collection.collection, field, tags);
				}

				components.schemas[tag.name] = schemaComponent;
			} else {
				const schemaComponent: SchemaObject = {
					type: 'object',
					properties: {},
					'x-collection': collection.collection,
				};

				// Track required fields
				const requiredFields: string[] = [];

				for (const field of fieldsInCollection) {
					const fieldSchema = this.generateField(schema, collection.collection, field, tags);
					schemaComponent.properties![field.field] = fieldSchema;

					// Check if field is required
					if (field.nullable === false && field.defaultValue === null && field.generated === false) {
						requiredFields.push(field.field);
					}
				}

				// Only add required if there are actually required fields
				if (requiredFields.length > 0) {
					schemaComponent.required = requiredFields;
				}

				components.schemas[tag.name] = schemaComponent;
			}
		}

		return components;
	}

	private filterCollectionFromParams(
		parameters: (ParameterObject | ReferenceObject)[],
	): (ParameterObject | ReferenceObject)[] {
		return parameters.filter((param) => (param as ReferenceObject)?.$ref !== '#/components/parameters/Collection');
	}

	private getActionForMethod(method: string): 'create' | 'read' | 'update' | 'delete' {
		switch (method) {
			case 'post':
				return 'create';
			case 'patch':
				return 'update';
			case 'delete':
				return 'delete';
			case 'get':
			default:
				return 'read';
		}
	}

	private generateField(
		schema: SchemaOverview,
		collection: string,
		field: FieldOverview,
		tags: TagObject[],
	): SchemaObject {
		let propertyObject: SchemaObject = {};

		propertyObject.nullable = field.nullable;

		if (field.note) {
			propertyObject.description = field.note;
		}

		const relation = getRelation(schema.relations, collection, field.field);

		if (!relation) {
			propertyObject = {
				...propertyObject,
				...this.fieldTypes[field.type],
			};
		} else {
			const relationType = getRelationType({
				relation,
				field: field.field,
				collection: collection,
			});

			if (relationType === 'm2o') {
				const relatedTag = tags.find((tag) => tag['x-collection'] === relation.related_collection);

				if (
					!relatedTag ||
					!relation.related_collection ||
					relation.related_collection in schema.collections === false
				) {
					return propertyObject;
				}

				const relatedCollection = schema.collections[relation.related_collection]!;
				const relatedPrimaryKeyField = relatedCollection.fields[relatedCollection.primary]!;

				propertyObject.oneOf = [
					{
						...this.fieldTypes[relatedPrimaryKeyField.type],
					},
					{
						$ref: `#/components/schemas/${relatedTag.name}`,
					},
				];
			} else if (relationType === 'o2m') {
				const relatedTag = tags.find((tag) => tag['x-collection'] === relation.collection);

				if (!relatedTag || !relation.related_collection || relation.collection in schema.collections === false) {
					return propertyObject;
				}

				const relatedCollection = schema.collections[relation.collection]!;
				const relatedPrimaryKeyField = relatedCollection.fields[relatedCollection.primary]!;

				if (!relatedTag || !relatedPrimaryKeyField) return propertyObject;

				propertyObject.type = 'array';

				propertyObject.items = {
					oneOf: [
						{
							...this.fieldTypes[relatedPrimaryKeyField.type],
						},
						{
							$ref: `#/components/schemas/${relatedTag.name}`,
						},
					],
				};
			} else if (relationType === 'a2o') {
				const relatedTags = tags.filter((tag) => relation.meta!.one_allowed_collections!.includes(tag['x-collection']));

				propertyObject.type = 'array';

				propertyObject.items = {
					oneOf: [
						{
							type: 'string',
						},
						...(relatedTags.map((tag) => ({
							$ref: `#/components/schemas/${tag.name}`,
						})) as any),
					],
				};
			}
		}

		return propertyObject;
	}

	private fieldTypes: Record<Type, Partial<SchemaObject>> = {
		alias: {
			type: 'string',
		},
		bigInteger: {
			type: 'integer',
			format: 'int64',
		},
		binary: {
			type: 'string',
			format: 'binary',
		},
		boolean: {
			type: 'boolean',
		},
		csv: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
		date: {
			type: 'string',
			format: 'date',
		},
		dateTime: {
			type: 'string',
			format: 'date-time',
		},
		decimal: {
			type: 'number',
		},
		float: {
			type: 'number',
			format: 'float',
		},
		hash: {
			type: 'string',
		},
		integer: {
			type: 'integer',
		},
		json: {},
		string: {
			type: 'string',
		},
		text: {
			type: 'string',
		},
		time: {
			type: 'string',
			format: 'time',
		},
		timestamp: {
			type: 'string',
			format: 'timestamp',
		},
		unknown: {},
		uuid: {
			type: 'string',
			format: 'uuid',
		},
		geometry: {
			type: 'object',
		},
		'geometry.Point': {
			type: 'object',
		},
		'geometry.LineString': {
			type: 'object',
		},
		'geometry.Polygon': {
			type: 'object',
		},
		'geometry.MultiPoint': {
			type: 'object',
		},
		'geometry.MultiLineString': {
			type: 'object',
		},
		'geometry.MultiPolygon': {
			type: 'object',
		},
	};
}

class GraphQLSpecsService implements SpecificationSubService {
	accountability: Accountability | null;
	knex: Knex;
	schema: SchemaOverview;

	items: GraphQLService;
	system: GraphQLService;

	constructor(options: AbstractServiceOptions) {
		this.accountability = options.accountability || null;
		this.knex = options.knex || getDatabase();
		this.schema = options.schema;

		this.items = new GraphQLService({ ...options, scope: 'items' });
		this.system = new GraphQLService({ ...options, scope: 'system' });
	}

	async generate(scope: 'items' | 'system') {
		if (scope === 'items') return this.items.getSchema('sdl');
		if (scope === 'system') return this.system.getSchema('sdl');
		return null;
	}
}
