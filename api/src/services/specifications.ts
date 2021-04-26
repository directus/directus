import {
	AbstractServiceOptions,
	Accountability,
	Collection,
	Field,
	Permission,
	Relation,
	SchemaOverview,
	types,
} from '../types';
import { CollectionsService } from './collections';
import { FieldsService } from './fields';
import formatTitle from '@directus/format-title';
import { cloneDeep, mergeWith } from 'lodash';
import { RelationsService } from './relations';
import env from '../env';
import { OpenAPIObject, PathItemObject, OperationObject, TagObject, SchemaObject } from 'openapi3-ts';

// @ts-ignore
import { version } from '../../package.json';
import openapi from '@directus/specs';

import { Knex } from 'knex';
import database from '../database';
import { getRelationType } from '../utils/get-relation-type';
import { GraphQLService } from './graphql';

export class SpecificationService {
	accountability: Accountability | null;
	knex: Knex;
	schema: SchemaOverview;

	fieldsService: FieldsService;
	collectionsService: CollectionsService;
	relationsService: RelationsService;

	oas: OASSpecsService;
	graphql: GraphQLSpecsService;

	constructor(options: AbstractServiceOptions) {
		this.accountability = options.accountability || null;
		this.knex = options.knex || database;
		this.schema = options.schema;

		this.fieldsService = new FieldsService(options);
		this.collectionsService = new CollectionsService(options);
		this.relationsService = new RelationsService(options);

		this.oas = new OASSpecsService(options, {
			fieldsService: this.fieldsService,
			collectionsService: this.collectionsService,
			relationsService: this.relationsService,
		});

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

	fieldsService: FieldsService;
	collectionsService: CollectionsService;
	relationsService: RelationsService;

	constructor(
		options: AbstractServiceOptions,
		{
			fieldsService,
			collectionsService,
			relationsService,
		}: {
			fieldsService: FieldsService;
			collectionsService: CollectionsService;
			relationsService: RelationsService;
		}
	) {
		this.accountability = options.accountability || null;
		this.knex = options.knex || database;
		this.schema = options.schema;

		this.fieldsService = fieldsService;
		this.collectionsService = collectionsService;
		this.relationsService = relationsService;
	}

	async generate() {
		const collections = await this.collectionsService.readByQuery();
		const fields = await this.fieldsService.readAll();
		const relations = (await this.relationsService.readByQuery({})) as Relation[];
		const permissions = this.schema.permissions;

		const tags = await this.generateTags(collections);
		const paths = await this.generatePaths(permissions, tags);
		const components = await this.generateComponents(collections, fields, relations, tags);

		const spec: OpenAPIObject = {
			openapi: '3.0.1',
			info: {
				title: 'Dynamic API Specification',
				description:
					'This is a dynamically generated API specification for all endpoints existing on the current project.',
				version: version,
			},
			servers: [
				{
					url: env.PUBLIC_URL,
					description: 'Your current Directus instance.',
				},
			],
			tags,
			paths,
			components,
		};

		return spec;
	}

	private async generateTags(collections: Collection[]): Promise<OpenAPIObject['tags']> {
		const systemTags = cloneDeep(openapi.tags)!;

		const tags: OpenAPIObject['tags'] = [];

		// System tags that don't have an associated collection are always readable to the user
		for (const systemTag of systemTags) {
			if (!systemTag['x-collection']) {
				tags.push(systemTag);
			}
		}

		for (const collection of collections) {
			const isSystem = collection.collection.startsWith('directus_');

			// If the collection is one of the system collections, pull the tag from the static spec
			if (isSystem) {
				for (const tag of openapi.tags!) {
					if (tag['x-collection'] === collection.collection) {
						tags.push(tag);
						break;
					}
				}
			} else {
				tags.push({
					name: 'Items' + formatTitle(collection.collection).replace(/ /g, ''),
					description: collection.meta?.note || undefined,
					'x-collection': collection.collection,
				});
			}
		}

		// Filter out the generic Items information
		return tags.filter((tag) => tag.name !== 'Items');
	}

	private async generatePaths(permissions: Permission[], tags: OpenAPIObject['tags']): Promise<OpenAPIObject['paths']> {
		const paths: OpenAPIObject['paths'] = {};

		if (!tags) return paths;

		for (const tag of tags) {
			const isSystem = tag.hasOwnProperty('x-collection') === false || tag['x-collection'].startsWith('directus_');

			if (isSystem) {
				for (const [path, pathItem] of Object.entries<PathItemObject>(openapi.paths)) {
					for (const [method, operation] of Object.entries<OperationObject>(pathItem)) {
						if (operation.tags?.includes(tag.name)) {
							if (!paths[path]) {
								paths[path] = {};
							}

							const hasPermission =
								this.accountability?.admin === true ||
								tag.hasOwnProperty('x-collection') === false ||
								!!permissions.find(
									(permission) =>
										permission.collection === tag['x-collection'] &&
										permission.action === this.getActionForMethod(method)
								);

							if (hasPermission) {
								paths[path][method] = operation;
							}
						}
					}
				}
			} else {
				const listBase = cloneDeep(openapi.paths['/items/{collection}']);
				const detailBase = cloneDeep(openapi.paths['/items/{collection}/{id}']);
				const collection = tag['x-collection'];

				for (const method of ['post', 'get', 'patch', 'delete']) {
					const hasPermission =
						this.accountability?.admin === true ||
						!!permissions.find(
							(permission) =>
								permission.collection === collection && permission.action === this.getActionForMethod(method)
						);

					if (hasPermission) {
						if (!paths[`/items/${collection}`]) paths[`/items/${collection}`] = {};
						if (!paths[`/items/${collection}/{id}`]) paths[`/items/${collection}/{id}`] = {};

						if (listBase[method]) {
							paths[`/items/${collection}`][method] = mergeWith(
								cloneDeep(listBase[method]),
								{
									description: listBase[method].description.replace('item', collection + ' item'),
									tags: [tag.name],
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
											content:
												method === 'delete'
													? undefined
													: {
															'application/json': {
																schema: {
																	properties: {
																		data: {
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
								}
							);
						}

						if (detailBase[method]) {
							paths[`/items/${collection}/{id}`][method] = mergeWith(
								cloneDeep(detailBase[method]),
								{
									description: detailBase[method].description.replace('item', collection + ' item'),
									tags: [tag.name],
									operationId: `${this.getActionForMethod(method)}Single${tag.name}`,
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
								}
							);
						}
					}
				}
			}
		}

		return paths;
	}

	private async generateComponents(
		collections: Collection[],
		fields: Field[],
		relations: Relation[],
		tags: OpenAPIObject['tags']
	): Promise<OpenAPIObject['components']> {
		let components: OpenAPIObject['components'] = cloneDeep(openapi.components);

		if (!components) components = {};

		components.schemas = {};

		if (!tags) return;

		for (const collection of collections) {
			const tag = tags.find((tag) => tag['x-collection'] === collection.collection);

			if (!tag) continue;

			const isSystem = collection.collection.startsWith('directus_');

			const fieldsInCollection = fields.filter((field) => field.collection === collection.collection);

			if (isSystem) {
				const schemaComponent: SchemaObject = cloneDeep(openapi.components!.schemas![tag.name]);

				schemaComponent.properties = {};

				for (const field of fieldsInCollection) {
					schemaComponent.properties[field.field] =
						(cloneDeep(
							(openapi.components!.schemas![tag.name] as SchemaObject).properties![field.field]
						) as SchemaObject) || this.generateField(field, relations, tags, fields);
				}

				components.schemas[tag.name] = schemaComponent;
			} else {
				const schemaComponent: SchemaObject = {
					type: 'object',
					properties: {},
					'x-collection': collection.collection,
				};

				for (const field of fieldsInCollection) {
					schemaComponent.properties![field.field] = this.generateField(field, relations, tags, fields);
				}

				components.schemas[tag.name] = schemaComponent;
			}
		}

		return components;
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

	private generateField(field: Field, relations: Relation[], tags: TagObject[], fields: Field[]): SchemaObject {
		let propertyObject: SchemaObject = {
			nullable: field.schema?.is_nullable,
			description: field.meta?.note || undefined,
		};

		const relation = relations.find(
			(relation) =>
				(relation.many_collection === field.collection && relation.many_field === field.field) ||
				(relation.one_collection === field.collection && relation.one_field === field.field)
		);

		if (!relation) {
			propertyObject = {
				...propertyObject,
				...this.fieldTypes[field.type],
			};
		} else {
			const relationType = getRelationType({
				relation,
				field: field.field,
				collection: field.collection,
			});

			if (relationType === 'm2o') {
				const relatedTag = tags.find((tag) => tag['x-collection'] === relation.one_collection);
				const relatedPrimaryKeyField = fields.find(
					(field) => field.collection === relation.one_collection && field.schema?.is_primary_key
				);

				if (!relatedTag || !relatedPrimaryKeyField) return propertyObject;

				propertyObject.oneOf = [
					{
						...this.fieldTypes[relatedPrimaryKeyField.type],
					},
					{
						$ref: `#/components/schemas/${relatedTag.name}`,
					},
				];
			} else if (relationType === 'o2m') {
				const relatedTag = tags.find((tag) => tag['x-collection'] === relation.many_collection);
				const relatedPrimaryKeyField = fields.find(
					(field) => field.collection === relation.many_collection && field.schema?.is_primary_key
				);

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
			} else if (relationType === 'm2a') {
				const relatedTags = tags.filter((tag) => relation.one_allowed_collections!.includes(tag['x-collection']));

				propertyObject.type = 'array';
				propertyObject.items = {
					oneOf: [
						{
							type: 'string',
						},
						relatedTags.map((tag) => ({
							$ref: `#/components/schemas/${tag.name}`,
						})),
					],
				};
			}
		}

		return propertyObject;
	}

	private fieldTypes: Record<
		typeof types[number],
		{
			type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'integer' | 'null' | undefined;
			format?: string;
			items?: any;
		}
	> = {
		bigInteger: {
			type: 'integer',
			format: 'int64',
		},
		boolean: {
			type: 'boolean',
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
		integer: {
			type: 'integer',
		},
		json: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
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
		binary: {
			type: 'string',
			format: 'binary',
		},
		uuid: {
			type: 'string',
			format: 'uuid',
		},
		csv: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
		hash: {
			type: 'string',
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
		this.knex = options.knex || database;
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
