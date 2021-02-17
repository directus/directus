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
} from '../types';
import Knex from 'knex';
import { ForbiddenException, FailedValidationException } from '../exceptions';
import { uniq, merge, flatten } from 'lodash';
import generateJoi from '../utils/generate-joi';
import { ItemsService } from './items';
import { PayloadService } from './payload';
import { parseFilter } from '../utils/parse-filter';
import { toArray } from '../utils/to-array';
import { systemFieldRows } from '../database/system-data/fields';

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

		let permissionsForCollections = this.schema.permissions.filter((permission) => {
			return (
				permission.action === action &&
				collectionsRequested.map(({ collection }) => collection).includes(permission.collection)
			);
		});

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
	validatePayload(action: PermissionsAction, collection: string, payloads: Partial<Item>[]): Promise<Partial<Item>[]>;
	validatePayload(action: PermissionsAction, collection: string, payload: Partial<Item>): Promise<Partial<Item>>;
	async validatePayload(
		action: PermissionsAction,
		collection: string,
		payload: Partial<Item>[] | Partial<Item>
	): Promise<Partial<Item>[] | Partial<Item>> {
		const validationErrors: FailedValidationException[] = [];

		let payloads = toArray(payload);

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
				for (const payload of payloads) {
					const keysInData = Object.keys(payload);
					const invalidKeys = keysInData.filter((fieldKey) => allowedFields.includes(fieldKey) === false);

					if (invalidKeys.length > 0) {
						throw new ForbiddenException(
							`You're not allowed to ${action} field "${invalidKeys[0]}" in collection "${collection}".`
						);
					}
				}
			}
		}

		const preset = parseFilter(permission.presets || {}, this.accountability);

		payloads = payloads.map((payload) => merge({}, preset, payload));

		const columns = Object.values(this.schema.tables[collection].columns);

		let requiredColumns: string[] = [];

		for (const column of columns) {
			const field =
				this.schema.fields.find((field) => field.collection === collection && field.field === column.column_name) ||
				systemFieldRows.find(
					(fieldMeta) => fieldMeta.field === column.column_name && fieldMeta.collection === collection
				);

			const specials = field?.special ?? [];

			const hasGenerateSpecial = ['uuid', 'date-created', 'role-created', 'user-created'].some((name) =>
				specials.includes(name)
			);

			const isRequired = column.is_nullable === false && column.default_value === null && hasGenerateSpecial === false;

			if (isRequired) {
				requiredColumns.push(column.column_name);
			}
		}

		if (requiredColumns.length > 0) {
			permission.validation = {
				_and: [permission.validation, {}],
			};

			if (action === 'create') {
				for (const name of requiredColumns) {
					permission.validation._and[1][name] = {
						_required: true,
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

		validationErrors.push(...this.validateJoi(permission.validation, payloads));

		if (validationErrors.length > 0) throw validationErrors;

		if (Array.isArray(payload)) {
			return payloads;
		} else {
			return payloads[0];
		}
	}

	validateJoi(
		validation: null | Record<string, any>,
		payloads: Partial<Record<string, any>>[]
	): FailedValidationException[] {
		if (!validation) return [];

		const errors: FailedValidationException[] = [];

		/**
		 * Note there can only be a single _and / _or per level
		 */

		if (Object.keys(validation)[0] === '_and') {
			const subValidation = Object.values(validation)[0];

			const nestedErrors = flatten<FailedValidationException>(
				subValidation.map((subObj: Record<string, any>) => {
					return this.validateJoi(subObj, payloads);
				})
			).filter((err?: FailedValidationException) => err);
			errors.push(...nestedErrors);
		} else if (Object.keys(validation)[0] === '_or') {
			const subValidation = Object.values(validation)[0];
			const nestedErrors = flatten<FailedValidationException>(
				subValidation.map((subObj: Record<string, any>) => this.validateJoi(subObj, payloads))
			);
			const allErrored = nestedErrors.every((err?: FailedValidationException) => err);

			if (allErrored) {
				errors.push(...nestedErrors);
			}
		} else {
			const schema = generateJoi(validation);

			for (const payload of payloads) {
				const { error } = schema.validate(payload, { abortEarly: false });

				if (error) {
					errors.push(...error.details.map((details) => new FailedValidationException(details)));
				}
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

		try {
			const query: Query = {
				fields: ['*'],
			};

			const result = await itemsService.readByKey(pk as any, query, action);

			if (!result) throw '';
			if (Array.isArray(pk) && pk.length > 1 && result.length !== pk.length) throw '';
		} catch {
			throw new ForbiddenException(`You're not allowed to ${action} item "${pk}" in collection "${collection}".`, {
				collection,
				item: pk,
				action,
			});
		}
	}
}
