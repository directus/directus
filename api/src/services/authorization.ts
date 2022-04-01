import { FailedValidationException } from '@directus/shared/exceptions';
import {
	Accountability,
	Aggregate,
	Filter,
	Permission,
	PermissionsAction,
	Query,
	SchemaOverview,
} from '@directus/shared/types';
import { validatePayload } from '@directus/shared/utils';
import { Knex } from 'knex';
import { cloneDeep, flatten, isArray, isNil, merge, reduce, uniq, uniqWith } from 'lodash';
import getDatabase from '../database';
import { ForbiddenException } from '../exceptions';
import { AbstractServiceOptions, AST, FieldNode, Item, NestedCollectionNode, PrimaryKey } from '../types';
import { stripFunction } from '../utils/strip-function';
import { ItemsService } from './items';
import { PayloadService } from './payload';

export class AuthorizationService {
	knex: Knex;
	accountability: Accountability | null;
	payloadService: PayloadService;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
		this.payloadService = new PayloadService('directus_permissions', {
			knex: this.knex,
			schema: this.schema,
		});
	}

	async processAST(ast: AST, action: PermissionsAction = 'read'): Promise<AST> {
		const collectionsRequested = getCollectionsFromAST(ast);

		const permissionsForCollections =
			uniqWith(
				this.accountability?.permissions?.filter((permission) => {
					return (
						permission.action === action &&
						collectionsRequested.map(({ collection }) => collection).includes(permission.collection)
					);
				}),
				(curr, prev) => curr.collection === prev.collection && curr.action === prev.action && curr.role === prev.role
			) ?? [];

		// If the permissions don't match the collections, you don't have permission to read all of them
		const uniqueCollectionsRequestedCount = uniq(collectionsRequested.map(({ collection }) => collection)).length;

		if (uniqueCollectionsRequestedCount !== permissionsForCollections.length) {
			throw new ForbiddenException();
		}

		validateFields(ast);
		validateFilterPermissions(ast, this.schema, this.accountability);
		applyFilters(ast, this.accountability);

		return ast;

		/**
		 * Traverses the AST and returns an array of all collections that are being fetched
		 */
		function getCollectionsFromAST(ast: AST | NestedCollectionNode): { collection: string; field: string }[] {
			const collections = [];

			if (ast.type === 'a2o') {
				collections.push(...ast.names.map((name) => ({ collection: name, field: ast.fieldKey })));

				for (const children of Object.values(ast.children)) {
					for (const nestedNode of children) {
						if (nestedNode.type !== 'field') {
							collections.push(...getCollectionsFromAST(nestedNode));
						}
					}
				}
			} else {
				collections.push({
					collection: ast.name,
					field: ast.type === 'root' ? null : ast.fieldKey,
				});

				for (const nestedNode of ast.children) {
					if (nestedNode.type !== 'field') {
						collections.push(...getCollectionsFromAST(nestedNode));
					}
				}
			}

			return collections as { collection: string; field: string }[];
		}

		function validateFields(ast: AST | NestedCollectionNode | FieldNode) {
			if (ast.type !== 'field') {
				if (ast.type === 'a2o') {
					for (const [collection, children] of Object.entries(ast.children)) {
						checkFields(collection, children, ast.query?.[collection]?.aggregate);
					}
				} else {
					checkFields(ast.name, ast.children, ast.query?.aggregate);
				}
			}

			function checkFields(
				collection: string,
				children: (NestedCollectionNode | FieldNode)[],
				aggregate?: Aggregate | null
			) {
				// We check the availability of the permissions in the step before this is run
				const permissions = permissionsForCollections.find((permission) => permission.collection === collection)!;
				const allowedFields = permissions.fields || [];

				if (aggregate && allowedFields.includes('*') === false) {
					for (const aliasMap of Object.values(aggregate)) {
						if (!aliasMap) continue;

						for (const column of Object.values(aliasMap)) {
							if (allowedFields.includes(column) === false) throw new ForbiddenException();
						}
					}
				}

				for (const childNode of children) {
					if (childNode.type !== 'field') {
						validateFields(childNode);
						continue;
					}

					if (allowedFields.includes('*')) continue;

					const fieldKey = stripFunction(childNode.name);

					if (allowedFields.includes(fieldKey) === false) {
						throw new ForbiddenException();
					}
				}
			}
		}

		function validateFilterPermissions(
			ast: AST | NestedCollectionNode | FieldNode,
			schema: SchemaOverview,
			accountability: Accountability | null
		) {
			let requiredFieldPermissions: Record<string, Set<string>> = {};

			if (ast.type !== 'field') {
				if (ast.type === 'a2o') {
					for (const collection of Object.keys(ast.children)) {
						requiredFieldPermissions = mergeRequiredFieldPermissions(
							requiredFieldPermissions,
							extractRequiredFieldPermissions(collection, ast.query?.[collection]?.filter ?? {})
						);

						for (const child of ast.children[collection]) {
							// Always add relational field as a deep child may have a filter
							if (child.type !== 'field') {
								(requiredFieldPermissions[collection] || (requiredFieldPermissions[collection] = new Set())).add(
									child.fieldKey
								);
							}

							requiredFieldPermissions = mergeRequiredFieldPermissions(
								requiredFieldPermissions,
								validateFilterPermissions(child, schema, accountability)
							);
						}
					}
				} else {
					requiredFieldPermissions = mergeRequiredFieldPermissions(
						requiredFieldPermissions,
						extractRequiredFieldPermissions(ast.name, ast.query?.filter ?? {})
					);

					for (const child of ast.children) {
						// Always add relational field as a deep child may have a filter
						if (child.type !== 'field') {
							(requiredFieldPermissions[ast.name] || (requiredFieldPermissions[ast.name] = new Set())).add(
								child.fieldKey
							);
						}

						requiredFieldPermissions = mergeRequiredFieldPermissions(
							requiredFieldPermissions,
							validateFilterPermissions(child, schema, accountability)
						);
					}
				}
			}

			if (ast.type === 'root') {
				// Validate all required permissions once at the root level
				checkFieldPermissions(requiredFieldPermissions);
			}

			return requiredFieldPermissions;

			function extractRequiredFieldPermissions(
				collection: string,
				filter: Filter,
				parentCollection?: string,
				parentField?: string
			) {
				return reduce(
					filter,
					function (result: Record<string, Set<string>>, filterValue, filterKey) {
						if (filterKey.startsWith('_')) {
							if (filterKey === '_and' || filterKey === '_or') {
								if (isArray(filterValue)) {
									for (const filter of filterValue as Filter[]) {
										const requiredPermissions = extractRequiredFieldPermissions(
											collection,
											filter,
											parentCollection,
											parentField
										);
										result = mergeRequiredFieldPermissions(result, requiredPermissions);
									}
								}
								return result;
							}
							// Filter value is not a filter, so we should skip it
							return result;
						} else {
							if (collection) {
								(result[collection] || (result[collection] = new Set())).add(filterKey);
							} else {
								const relation = schema.relations.find((relation) => {
									return (
										(relation.collection === parentCollection && relation.field === parentField) ||
										(relation.related_collection === parentCollection && relation.meta?.one_field === parentField)
									);
								});

								if (relation) {
									if (relation.related_collection === parentCollection) {
										(result[relation.collection] || (result[relation.collection] = new Set())).add(filterKey);
										parentCollection = relation.collection;
									} else {
										(result[relation.related_collection!] || (result[relation.related_collection!] = new Set())).add(
											filterKey
										);
										parentCollection = relation.related_collection!;
									}
								} else {
									// Filter key not found in parent collection
									throw new ForbiddenException();
								}
							}

							if (typeof filterValue === 'object') {
								// Parent collection is undefined when we process the top level filter
								if (!parentCollection) parentCollection = collection;

								for (const [childFilterKey, childFilterValue] of Object.entries(filterValue)) {
									if (childFilterKey.startsWith('_')) {
										if (childFilterKey === '_and' || childFilterKey === '_or') {
											if (isArray(childFilterValue)) {
												for (const filter of childFilterValue as Filter[]) {
													const requiredPermissions = extractRequiredFieldPermissions(
														'',
														filter,
														parentCollection,
														filterKey
													);
													result = mergeRequiredFieldPermissions(result, requiredPermissions);
												}
											}
										}
									} else {
										const requiredPermissions = extractRequiredFieldPermissions(
											'',
											filterValue,
											parentCollection,
											filterKey
										);
										result = mergeRequiredFieldPermissions(result, requiredPermissions);
									}
								}
							}
						}

						return result;
					},
					{}
				);
			}

			function mergeRequiredFieldPermissions(current: Record<string, Set<string>>, child: Record<string, Set<string>>) {
				for (const collection of Object.keys(child)) {
					if (!current[collection]) {
						current[collection] = child[collection];
					} else {
						current[collection] = new Set([...current[collection], ...child[collection]]);
					}
				}
				return current;
			}

			function checkFieldPermissions(requiredPermissions: Record<string, Set<string>>) {
				if (accountability?.admin === true) return;

				for (const collection of Object.keys(requiredPermissions)) {
					const permission = accountability?.permissions?.find(
						(permission) => permission.collection === collection && permission.action === 'read'
					);

					if (!permission || !permission.fields) throw new ForbiddenException();

					const allowedFields = permission.fields;

					if (allowedFields.includes('*')) continue;
					// Allow legacy permissions with an empty fields array, where id can be accessed
					if (allowedFields.length === 0) allowedFields.push('id');

					for (const field of requiredPermissions[collection]) {
						if (!allowedFields.includes(field)) throw new ForbiddenException();
					}
				}
			}
		}

		function applyFilters(
			ast: AST | NestedCollectionNode | FieldNode,
			accountability: Accountability | null
		): AST | NestedCollectionNode | FieldNode {
			if (ast.type !== 'field') {
				if (ast.type === 'a2o') {
					const collections = Object.keys(ast.children);

					for (const collection of collections) {
						updateFilterQuery(collection, ast.query[collection]);
					}

					for (const [collection, children] of Object.entries(ast.children)) {
						ast.children[collection] = children.map((child) => applyFilters(child, accountability)) as (
							| NestedCollectionNode
							| FieldNode
						)[];
					}
				} else {
					const collection = ast.name;

					updateFilterQuery(collection, ast.query);

					ast.children = ast.children.map((child) => applyFilters(child, accountability)) as (
						| NestedCollectionNode
						| FieldNode
					)[];
				}
			}

			return ast;

			function updateFilterQuery(collection: string, query: Query) {
				// We check the availability of the permissions in the step before this is run
				const permissions = permissionsForCollections.find((permission) => permission.collection === collection)!;

				if (!query.filter || Object.keys(query.filter).length === 0) {
					query.filter = { _and: [] };
				} else {
					query.filter = { _and: [query.filter] };
				}

				if (permissions.permissions && Object.keys(permissions.permissions).length > 0) {
					query.filter._and.push(permissions.permissions);
				}

				if (query.filter._and.length === 0) delete query.filter;
			}
		}
	}

	/**
	 * Checks if the provided payload matches the configured permissions, and adds the presets to the payload.
	 */
	validatePayload(action: PermissionsAction, collection: string, data: Partial<Item>): Partial<Item> {
		const payload = cloneDeep(data);

		let permission: Permission | undefined;

		if (this.accountability?.admin === true) {
			permission = {
				id: 0,
				role: this.accountability?.role,
				collection,
				action,
				permissions: {},
				validation: {},
				fields: ['*'],
				presets: {},
			};
		} else {
			permission = this.accountability?.permissions?.find((permission) => {
				return permission.collection === collection && permission.action === action;
			});

			if (!permission) throw new ForbiddenException();

			// Check if you have permission to access the fields you're trying to access

			const allowedFields = permission.fields || [];

			if (allowedFields.includes('*') === false) {
				const keysInData = Object.keys(payload);
				const invalidKeys = keysInData.filter((fieldKey) => allowedFields.includes(fieldKey) === false);

				if (invalidKeys.length > 0) {
					throw new ForbiddenException();
				}
			}
		}

		const preset = permission.presets ?? {};

		const payloadWithPresets = merge({}, preset, payload);

		const fieldValidationRules = Object.values(this.schema.collections[collection].fields)
			.map((field) => field.validation)
			.filter((v) => v) as Filter[];

		const hasValidationRules =
			isNil(permission.validation) === false && Object.keys(permission.validation ?? {}).length > 0;

		const hasFieldValidationRules = fieldValidationRules && fieldValidationRules.length > 0;

		const requiredColumns: SchemaOverview['collections'][string]['fields'][string][] = [];

		for (const field of Object.values(this.schema.collections[collection].fields)) {
			const specials = field?.special ?? [];

			const hasGenerateSpecial = ['uuid', 'date-created', 'role-created', 'user-created'].some((name) =>
				specials.includes(name)
			);

			const nullable = field.nullable || hasGenerateSpecial || field.generated;

			if (!nullable) {
				requiredColumns.push(field);
			}
		}

		if (hasValidationRules === false && hasFieldValidationRules === false && requiredColumns.length === 0) {
			return payloadWithPresets;
		}

		if (requiredColumns.length > 0) {
			permission.validation = hasValidationRules ? { _and: [permission.validation!] } : { _and: [] };

			for (const field of requiredColumns) {
				if (action === 'create' && field.defaultValue === null) {
					permission.validation._and.push({
						[field.field]: {
							_submitted: true,
						},
					});
				}

				permission.validation._and.push({
					[field.field]: {
						_nnull: true,
					},
				});
			}
		}

		if (hasFieldValidationRules) {
			if (permission.validation) {
				permission.validation = { _and: [permission.validation, ...fieldValidationRules] };
			} else {
				permission.validation = { _and: fieldValidationRules };
			}
		}

		const validationErrors: FailedValidationException[] = [];

		validationErrors.push(
			...flatten(
				validatePayload(permission.validation!, payloadWithPresets).map((error) =>
					error.details.map((details) => new FailedValidationException(details))
				)
			)
		);

		if (validationErrors.length > 0) throw validationErrors;

		return payloadWithPresets;
	}

	async checkAccess(action: PermissionsAction, collection: string, pk: PrimaryKey | PrimaryKey[]): Promise<void> {
		if (this.accountability?.admin === true) return;

		const itemsService = new ItemsService(collection, {
			accountability: this.accountability,
			knex: this.knex,
			schema: this.schema,
		});

		const query: Query = {
			fields: ['*'],
		};

		if (Array.isArray(pk)) {
			const result = await itemsService.readMany(pk, { ...query, limit: pk.length }, { permissionsAction: action });
			if (!result) throw new ForbiddenException();
			if (result.length !== pk.length) throw new ForbiddenException();
		} else {
			const result = await itemsService.readOne(pk, query, { permissionsAction: action });
			if (!result) throw new ForbiddenException();
		}
	}
}
