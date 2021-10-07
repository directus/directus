import { Knex } from 'knex';
import { cloneDeep, merge, uniq, uniqWith, flatten, isNil } from 'lodash';
import getDatabase from '../database';
import { ForbiddenException } from '../exceptions';
import { FailedValidationException } from '@directus/shared/exceptions';
import { validatePayload, parseFilter } from '@directus/shared/utils';
import { Accountability } from '@directus/shared/types';
import {
	AbstractServiceOptions,
	AST,
	FieldNode,
	Item,
	NestedCollectionNode,
	PrimaryKey,
	SchemaOverview,
} from '../types';
import { Query, Aggregate, Permission, PermissionsAction } from '@directus/shared/types';
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

		const permissionsForCollections = uniqWith(
			this.schema.permissions.filter((permission) => {
				return (
					permission.action === action &&
					collectionsRequested.map(({ collection }) => collection).includes(permission.collection)
				);
			}),
			(curr, prev) => curr.collection === prev.collection && curr.action === prev.action && curr.role === prev.role
		);

		// If the permissions don't match the collections, you don't have permission to read all of them
		const uniqueCollectionsRequestedCount = uniq(collectionsRequested.map(({ collection }) => collection)).length;

		if (uniqueCollectionsRequestedCount !== permissionsForCollections.length) {
			throw new ForbiddenException();
		}

		validateFields(ast);
		applyFilters(ast, this.accountability);

		return ast;

		/**
		 * Traverses the AST and returns an array of all collections that are being fetched
		 */
		function getCollectionsFromAST(ast: AST | NestedCollectionNode): { collection: string; field: string }[] {
			const collections = [];

			if (ast.type === 'm2a') {
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
				if (ast.type === 'm2a') {
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

					const fieldKey = childNode.name;

					if (allowedFields.includes(fieldKey) === false) {
						throw new ForbiddenException();
					}
				}
			}
		}

		function applyFilters(
			ast: AST | NestedCollectionNode | FieldNode,
			accountability: Accountability | null
		): AST | NestedCollectionNode | FieldNode {
			if (ast.type !== 'field') {
				if (ast.type === 'm2a') {
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

				const parsedPermissions = parseFilter(permissions.permissions, accountability);

				if (!query.filter || Object.keys(query.filter).length === 0) {
					query.filter = { _and: [] };
				} else {
					query.filter = { _and: [query.filter] };
				}

				if (parsedPermissions && Object.keys(parsedPermissions).length > 0) {
					query.filter._and.push(parsedPermissions);
				}

				if (query.filter._and.length === 0) delete query.filter;
			}
		}
	}

	/**
	 * Checks if the provided payload matches the configured permissions, and adds the presets to the payload.
	 */
	validatePayload(action: PermissionsAction, collection: string, data: Partial<Item>): Promise<Partial<Item>> {
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
			permission = this.schema.permissions.find((permission) => {
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

		const preset = parseFilter(permission.presets || {}, this.accountability);

		const payloadWithPresets = merge({}, preset, payload);

		const hasValidationRules =
			isNil(permission.validation) === false && Object.keys(permission.validation ?? {}).length > 0;

		const requiredColumns: SchemaOverview['collections'][string]['fields'][string][] = [];

		for (const field of Object.values(this.schema.collections[collection].fields)) {
			const specials = field?.special ?? [];

			const hasGenerateSpecial = ['uuid', 'date-created', 'role-created', 'user-created'].some((name) =>
				specials.includes(name)
			);

			const notNullable = field.nullable === false && hasGenerateSpecial === false;

			if (notNullable) {
				requiredColumns.push(field);
			}
		}

		if (hasValidationRules === false && requiredColumns.length === 0) {
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

		const validationErrors: FailedValidationException[] = [];

		validationErrors.push(
			...flatten(
				validatePayload(parseFilter(permission.validation!, this.accountability), payloadWithPresets).map((error) =>
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
