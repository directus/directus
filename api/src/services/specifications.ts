// import {
// 	AbstractServiceOptions,
// 	Accountability,
// 	Collection,
// 	Field,
// 	Relation,
// 	types,
// } from '../types';
// import { CollectionsService } from './collections';
// import { FieldsService } from './fields';
// import formatTitle from '@directus/format-title';
// import { cloneDeep, mergeWith } from 'lodash';
// import { RelationsService } from './relations';
// import env from '../env';

// // @ts-ignore
// import { version } from '../../package.json';

// // @ts-ignore
// import openapi from '@directus/specs';

// type RelationTree = Record<string, Record<string, Relation[]>>;

// export class SpecificationService {
// 	accountability: Accountability | null;

// 	fieldsService: FieldsService;
// 	collectionsService: CollectionsService;
// 	relationsService: RelationsService;

// 	oas: OASService;

// 	constructor(options?: AbstractServiceOptions) {
// 		this.accountability = options?.accountability || null;

// 		this.fieldsService = new FieldsService(options);
// 		this.collectionsService = new CollectionsService(options);
// 		this.relationsService = new RelationsService(options);

// 		this.oas = new OASService({
// 			fieldsService: this.fieldsService,
// 			collectionsService: this.collectionsService,
// 			relationsService: this.relationsService,
// 		});
// 	}
// }

// interface SpecificationSubService {
// 	generate: () => Promise<any>;
// }

// class OASService implements SpecificationSubService {
// 	fieldsService: FieldsService;
// 	collectionsService: CollectionsService;
// 	relationsService: RelationsService;

// 	constructor({
// 		fieldsService,
// 		collectionsService,
// 		relationsService,
// 	}: {
// 		fieldsService: FieldsService;
// 		collectionsService: CollectionsService;
// 		relationsService: RelationsService;
// 	}) {
// 		this.fieldsService = fieldsService;
// 		this.collectionsService = collectionsService;
// 		this.relationsService = relationsService;
// 	}

// 	private collectionsDenyList = [
// 		'directus_collections',
// 		'directus_fields',
// 		'directus_migrations',
// 		'directus_sessions',
// 	];

// 	private fieldTypes: Record<
// 		typeof types[number],
// 		{ type: string; format?: string; items?: any }
// 	> = {
// 		bigInteger: {
// 			type: 'integer',
// 			format: 'int64',
// 		},
// 		boolean: {
// 			type: 'boolean',
// 		},
// 		date: {
// 			type: 'string',
// 			format: 'date',
// 		},
// 		dateTime: {
// 			type: 'string',
// 			format: 'date-time',
// 		},
// 		decimal: {
// 			type: 'number',
// 		},
// 		float: {
// 			type: 'number',
// 			format: 'float',
// 		},
// 		integer: {
// 			type: 'integer',
// 		},
// 		json: {
// 			type: 'array',
// 			items: {
// 				type: 'string',
// 			},
// 		},
// 		string: {
// 			type: 'string',
// 		},
// 		text: {
// 			type: 'string',
// 		},
// 		time: {
// 			type: 'string',
// 			format: 'time',
// 		},
// 		timestamp: {
// 			type: 'string',
// 			format: 'timestamp',
// 		},
// 		binary: {
// 			type: 'string',
// 			format: 'binary',
// 		},
// 		uuid: {
// 			type: 'string',
// 			format: 'uuid',
// 		},
// 		csv: {
// 			type: 'array',
// 			items: {
// 				type: 'string',
// 			},
// 		},
// 	};

// 	async generate() {
// 		const collections = await this.collectionsService.readByQuery();

// 		const userCollections = collections.filter(
// 			(collection) =>
// 				collection.collection.startsWith('directus_') === false ||
// 				this.collectionsDenyList.includes(collection.collection) === false
// 		);

// 		const allFields = await this.fieldsService.readAll();

// 		const fields: Record<string, Field[]> = {};

// 		for (const field of allFields) {
// 			if (
// 				field.collection.startsWith('directus_') === false ||
// 				this.collectionsDenyList.includes(field.collection) === false
// 			) {
// 				if (field.collection in fields) {
// 					fields[field.collection].push(field);
// 				} else {
// 					fields[field.collection] = [field];
// 				}
// 			}
// 		}

// 		const relationsResult = await this.relationsService.readByQuery({});
// 		if (relationsResult === null) return {};

// 		const relations = Array.isArray(relationsResult) ? relationsResult : [relationsResult];

// 		const relationsTree: RelationTree = {};

// 		for (const relation of relations as Relation[]) {
// 			if (relation.many_collection in relationsTree === false)
// 				relationsTree[relation.many_collection] = {};
// 			if (relation.one_collection in relationsTree === false)
// 				relationsTree[relation.one_collection] = {};

// 			if (relation.many_field in relationsTree[relation.many_collection] === false)
// 				relationsTree[relation.many_collection][relation.many_field] = [];
// 			if (relation.one_field in relationsTree[relation.one_collection] === false)
// 				relationsTree[relation.one_collection][relation.one_field] = [];

// 			relationsTree[relation.many_collection][relation.many_field].push(relation);
// 			relationsTree[relation.one_collection][relation.one_field].push(relation);
// 		}

// 		const dynOpenapi = {
// 			openapi: '3.0.1',
// 			info: {
// 				title: 'Dynamic Api Specification',
// 				description:
// 					'This is a dynamicly generated api specification for all endpoints existing on the api.',
// 				version: version,
// 			},
// 			servers: [
// 				{
// 					url: env.PUBLIC_URL,
// 					description: 'Your current api server.',
// 				},
// 			],
// 			tags: this.generateTags(userCollections),
// 			paths: this.generatePaths(userCollections),
// 			components: {
// 				schemas: this.generateSchemas(userCollections, fields, relationsTree),
// 			},
// 		};

// 		return mergeWith(cloneDeep(openapi), cloneDeep(dynOpenapi), (obj, src) => {
// 			if (Array.isArray(obj)) return obj.concat(src);
// 		});
// 	}

// 	private getNameFormats(collection: string) {
// 		const isInternal = collection.startsWith('directus_');
// 		const schema = formatTitle(
// 			isInternal ? collection.replace('directus_', '').replace(/s$/, '') : collection + 'Item'
// 		).replace(/ /g, '');
// 		const tag = formatTitle(
// 			isInternal ? collection.replace('directus_', '') : collection + ' Collection'
// 		);
// 		const path = isInternal ? collection : '/items/' + collection;
// 		const objectRef = `#/components/schemas/${schema}`;

// 		return { schema, tag, path, objectRef };
// 	}

// 	private generateTags(collections: Collection[]) {
// 		const tags: { name: string; description?: string }[] = [];

// 		for (const collection of collections) {
// 			if (collection.collection.startsWith('directus_')) continue;
// 			const { tag } = this.getNameFormats(collection.collection);
// 			tags.push({ name: tag, description: collection.meta?.note || undefined });
// 		}

// 		return tags;
// 	}

// 	private generatePaths(collections: Collection[]) {
// 		const paths: Record<string, object> = {};

// 		for (const collection of collections) {
// 			if (collection.collection.startsWith('directus_')) continue;

// 			const { tag, schema, objectRef, path } = this.getNameFormats(collection.collection);

// 			const objectSingle = {
// 				content: {
// 					'application/json': {
// 						schema: {
// 							$ref: objectRef,
// 						},
// 					},
// 				},
// 			};

// 			(paths[path] = {
// 				get: {
// 					operationId: `get${schema}s`,
// 					description: `List all items from the ${tag}`,
// 					tags: [tag],
// 					parameters: [
// 						{ $ref: '#/components/parameters/Fields' },
// 						{ $ref: '#/components/parameters/Limit' },
// 						{ $ref: '#/components/parameters/Meta' },
// 						{ $ref: '#/components/parameters/Offset' },
// 						{ $ref: '#/components/parameters/Single' },
// 						{ $ref: '#/components/parameters/Sort' },
// 						{ $ref: '#/components/parameters/Filter' },
// 						{ $ref: '#/components/parameters/q' },
// 					],
// 					responses: {
// 						'200': {
// 							description: 'Successful request',
// 							content: {
// 								'application/json': {
// 									schema: {
// 										type: 'object',
// 										properties: {
// 											data: {
// 												type: 'array',
// 												items: {
// 													$ref: objectRef,
// 												},
// 											},
// 										},
// 									},
// 								},
// 							},
// 						},
// 						'401': {
// 							$ref: '#/components/responses/UnauthorizedError',
// 						},
// 					},
// 				},
// 				post: {
// 					operationId: `create${schema}`,
// 					description: `Create a new item in the ${tag}`,
// 					tags: [tag],
// 					parameter: [{ $ref: '#/components/parameters/Meta' }],
// 					requestBody: objectSingle,
// 					responses: {
// 						'200': objectSingle,
// 						'401': {
// 							$ref: '#/components/responses/UnauthorizedError',
// 						},
// 					},
// 				},
// 			}),
// 				(paths[path + '/{id}'] = {
// 					parameters: [{ $ref: '#/components/parameters/Id' }],
// 					get: {
// 						operationId: `get${schema}`,
// 						description: `Get a singe item from the ${tag}`,
// 						tags: [tag],
// 						parameters: [
// 							{ $ref: '#/components/parameters/Fields' },
// 							{ $ref: '#/components/parameters/Meta' },
// 						],
// 						responses: {
// 							'200': objectSingle,
// 							'401': {
// 								$ref: '#/components/responses/UnauthorizedError',
// 							},
// 							'404': {
// 								$ref: '#/components/responses/NotFoundError',
// 							},
// 						},
// 					},
// 					patch: {
// 						operationId: `update${schema}`,
// 						description: `Update an item from the ${tag}`,
// 						tags: [tag],
// 						parameters: [
// 							{ $ref: '#/components/parameters/Fields' },
// 							{ $ref: '#/components/parameters/Meta' },
// 						],
// 						requestBody: objectSingle,
// 						responses: {
// 							'200': objectSingle,
// 							'401': {
// 								$ref: '#/components/responses/UnauthorizedError',
// 							},
// 							'404': {
// 								$ref: '#/components/responses/NotFoundError',
// 							},
// 						},
// 					},
// 					delete: {
// 						operationId: `delete${schema}`,
// 						description: `Delete an item from the ${tag}`,
// 						tags: [tag],
// 						responses: {
// 							'200': {
// 								description: 'Successful request',
// 							},
// 							'401': {
// 								$ref: '#/components/responses/UnauthorizedError',
// 							},
// 							'404': {
// 								$ref: '#/components/responses/NotFoundError',
// 							},
// 						},
// 					},
// 				});
// 		}

// 		return paths;
// 	}

// 	private generateSchemas(
// 		collections: Collection[],
// 		fields: Record<string, Field[]>,
// 		relations: RelationTree
// 	) {
// 		const schemas: Record<string, any> = {};

// 		for (const collection of collections) {
// 			const { schema, tag } = this.getNameFormats(collection.collection);

// 			if (fields === undefined) return;

// 			schemas[schema] = {
// 				type: 'object',
// 				'x-tag': tag,
// 				properties: {},
// 			};

// 			for (const field of fields[collection.collection]) {
// 				const fieldRelations =
// 					field.collection in relations && field.field in relations[field.collection]
// 						? relations[field.collection][field.field]
// 						: [];

// 				if (fieldRelations.length !== 0) {
// 					const relation = fieldRelations[0];
// 					const isM2O =
// 						relation.many_collection === field.collection &&
// 						relation.many_field === field.field;

// 					const relatedCollection = isM2O
// 						? relation.one_collection
// 						: relation.many_collection;
// 					if (!relatedCollection) continue;

// 					const relatedPrimaryField = fields[relatedCollection].find(
// 						(field) => field.schema?.is_primary_key
// 					);
// 					if (relatedPrimaryField?.type === undefined) continue;

// 					const relatedType = this.fieldTypes[relatedPrimaryField?.type];
// 					const { objectRef } = this.getNameFormats(relatedCollection);

// 					const type = isM2O
// 						? {
// 								oneOf: [
// 									{
// 										...relatedType,
// 										nullable: field.schema?.is_nullable === true,
// 									},
// 									{ $ref: objectRef },
// 								],
// 						  }
// 						: {
// 								type: 'array',
// 								items: { $ref: objectRef },
// 								nullable: field.schema?.is_nullable === true,
// 						  };

// 					schemas[schema].properties[field.field] = {
// 						...type,
// 						description: field.meta?.note || undefined,
// 					};
// 				} else {
// 					schemas[schema].properties[field.field] = {
// 						...this.fieldTypes[field.type],
// 						nullable: field.schema?.is_nullable === true,
// 						description: field.meta?.note || undefined,
// 					};
// 				}
// 			}
// 		}
// 		return schemas;
// 	}
// }
