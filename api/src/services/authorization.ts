import database from '../database';
import {
	Accountability,
	AbstractServiceOptions,
	AST,
	NestedCollectionNode,
	FieldNode,
	Query,
	Permission,
	PermissionsAction,
	Item,
	PrimaryKey,
	SchemaOverview,
	Filter,
} from '../types';
import { Knex } from 'knex';
import { ForbiddenException, FailedValidationException } from '../exceptions';
import { uniq, uniqWith, merge, flatten, cloneDeep } from 'lodash';
import generateJoi from '../utils/generate-joi';
import { ItemsService } from './items';
import { PayloadService } from './payload';
import { parseFilter } from '../utils/parse-filter';

export class AuthorizationService {
	knex: Knex;
	accountability: Accountability | null;
	payloadService: PayloadService;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || database;
		this.accountability = options.accountability || null;
		this.schema = options.schema;
		this.payloadService = new PayloadService('directus_permissions', {
			knex: this.knex,
			schema: this.schema,
		});
	}

	async processAST(ast: AST, action: PermissionsAction = 'read'): Promise<AST> {
		const collectionsRequested = getCollectionsFromAST(ast);

		let permissionsForCollections = uniqWith(
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
			// Find the first collection that doesn't have permissions configured
			const { collection, field } = collectionsRequested.find(
				({ collection }) =>
					permissionsForCollections.find((permission) => permission.collection === collection) === undefined
			)!;

			if (field) {
				throw new ForbiddenException(`You don't have permission to access the "${field}" field.`);
			} else {
				throw new ForbiddenException(`You don't have permission to access the "${collection}" collection.`);
			}
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

				/** @TODO add nestedNode */
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
			if (ast.type !== 'field' && ast.type !== 'm2a') {
				/** @TODO remove m2a check */
				const collection = ast.name;

				// We check the availability of the permissions in the step before this is run
				const permissions = permissionsForCollections.find((permission) => permission.collection === collection)!;

				const allowedFields = permissions.fields || [];

				for (const childNode of ast.children) {
					if (childNode.type !== 'field') {
						validateFields(childNode);
						continue;
					}

					if (allowedFields.includes('*')) continue;

					const fieldKey = childNode.name;

					if (allowedFields.includes(fieldKey) === false) {
						throw new ForbiddenException(`You don't have permission to access the "${fieldKey}" field.`);
					}
				}
			}
		}

		function applyFilters(
			ast: AST | NestedCollectionNode | FieldNode,
			accountability: Accountability | null
		): AST | NestedCollectionNode | FieldNode {
			if (ast.type !== 'field' && ast.type !== 'm2a') {
				/** @TODO remove m2a check */
				const collection = ast.name;

				// We check the availability of the permissions in the step before this is run
				const permissions = permissionsForCollections.find((permission) => permission.collection === collection)!;

				const parsedPermissions = parseFilter(permissions.permissions, accountability);

				if (!ast.query.filter || Object.keys(ast.query.filter).length === 0) {
					ast.query.filter = { _and: [] };
				} else {
					ast.query.filter = { _and: [ast.query.filter] };
				}

				if (parsedPermissions && Object.keys(parsedPermissions).length > 0) {
					ast.query.filter._and.push(parsedPermissions);
				}

				if (ast.query.filter._and.length === 0) delete ast.query.filter._and;

				if (permissions.limit && ast.query.limit && ast.query.limit > permissions.limit) {
					throw new ForbiddenException(`You can't read more than ${permissions.limit} items at a time.`);
				}

				// Default to the permissions limit if limit hasn't been set
				if (permissions.limit && !ast.query.limit) {
					ast.query.limit = permissions.limit;
				}

				ast.children = ast.children.map((child) => applyFilters(child, accountability)) as (
					| NestedCollectionNode
					| FieldNode
				)[];
			}

			return ast;
		}
	}

	/**
	 * Checks if the provided payload matches the configured permissions, and adds the presets to the payload.
	 */
	validatePayload(action: PermissionsAction, collection: string, data: Partial<Item>): Promise<Partial<Item>> {
		const validationErrors: FailedValidationException[] = [];

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
				limit: null,
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
					throw new ForbiddenException(
						`You're not allowed to ${action} field "${invalidKeys[0]}" in collection "${collection}".`
					);
				}
			}
		}

		const preset = parseFilter(permission.presets || {}, this.accountability);

		const payloadWithPresets = merge({}, preset, payload);

		let requiredColumns: string[] = [];

		for (const [name, field] of Object.entries(this.schema.collections[collection].fields)) {
			const specials = field?.special ?? [];

			const hasGenerateSpecial = ['uuid', 'date-created', 'role-created', 'user-created'].some((name) =>
				specials.includes(name)
			);

			const isRequired = field.nullable === false && field.defaultValue === null && hasGenerateSpecial === false;

			if (isRequired) {
				requiredColumns.push(name);
			}
		}

		if (requiredColumns.length > 0) {
			permission.validation = {
				_and: [permission.validation, {}],
			};

			if (action === 'create') {
				for (const name of requiredColumns) {
					permission.validation._and[1][name] = {
						_submitted: true,
					};
				}
			} else {
				for (const name of requiredColumns) {
					permission.validation._and[1][name] = {
						_nnull: true,
					};
				}
			}
		}

		validationErrors.push(
			...this.validateJoi(parseFilter(permission.validation || {}, this.accountability), payloadWithPresets)
		);

		if (validationErrors.length > 0) throw validationErrors;

		return payloadWithPresets;
	}

	validateJoi(validation: Filter, payload: Partial<Item>): FailedValidationException[] {
		if (!validation) return [];

		const errors: FailedValidationException[] = [];

		/**
		 * Note there can only be a single _and / _or per level
		 */

		if (Object.keys(validation)[0] === '_and') {
			const subValidation = Object.values(validation)[0];

			const nestedErrors = flatten<FailedValidationException>(
				subValidation.map((subObj: Record<string, any>) => {
					return this.validateJoi(subObj, payload);
				})
			).filter((err?: FailedValidationException) => err);
			errors.push(...nestedErrors);
		} else if (Object.keys(validation)[0] === '_or') {
			const subValidation = Object.values(validation)[0];
			const nestedErrors = flatten<FailedValidationException>(
				subValidation.map((subObj: Record<string, any>) => this.validateJoi(subObj, payload))
			);
			const allErrored = nestedErrors.every((err?: FailedValidationException) => err);

			if (allErrored) {
				errors.push(...nestedErrors);
			}
		} else {
			const schema = generateJoi(validation);

			const { error } = schema.validate(payload, { abortEarly: false });

			if (error) {
				errors.push(...error.details.map((details) => new FailedValidationException(details)));
			}
		}

		return errors;
	}

	async checkAccess(action: PermissionsAction, collection: string, pk: PrimaryKey | PrimaryKey[]) {
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
			const result = await itemsService.readMany(pk, query, { permissionsAction: action });
			if (!result) throw new ForbiddenException();
			if (result.length !== pk.length) throw new ForbiddenException();
		} else {
			const result = await itemsService.readOne(pk, query, { permissionsAction: action });
			if (!result) throw new ForbiddenException();
		}
	}
}
