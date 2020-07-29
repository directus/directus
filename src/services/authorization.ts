import database from '../database';
import {
	Accountability,
	AbstractServiceOptions,
	AST,
	NestedCollectionAST,
	FieldAST,
	Query,
	Permission,
	Operation,
	Item,
	PrimaryKey,
} from '../types';
import Knex from 'knex';
import { ForbiddenException, InvalidPayloadException } from '../exceptions';
import { uniq, merge } from 'lodash';
import generateJoi from '../utils/generate-joi';
import ItemsService from './items';

export default class AuthorizationService {
	knex: Knex;
	accountability: Accountability | null;

	constructor(options?: AbstractServiceOptions) {
		this.knex = options?.knex || database;
		this.accountability = options?.accountability || null;
	}

	async processAST(ast: AST, operation: Operation = 'read'): Promise<AST> {
		const collectionsRequested = getCollectionsFromAST(ast);

		const permissionsForCollections = await this.knex
			.select<Permission[]>('*')
			.from('directus_permissions')
			.where({ operation, role: this.accountability?.role })
			.whereIn(
				'collection',
				collectionsRequested.map(({ collection }) => collection)
			);

		// If the permissions don't match the collections, you don't have permission to read all of them
		const uniqueCollectionsRequestedCount = uniq(
			collectionsRequested.map(({ collection }) => collection)
		).length;

		if (uniqueCollectionsRequestedCount !== permissionsForCollections.length) {
			// Find the first collection that doesn't have permissions configured
			const { collection, field } = collectionsRequested.find(
				({ collection }) =>
					permissionsForCollections.find(
						(permission) => permission.collection === collection
					) === undefined
			)!;

			if (field) {
				throw new ForbiddenException(
					`You don't have permission to access the "${field}" field.`
				);
			} else {
				throw new ForbiddenException(
					`You don't have permission to access the "${collection}" collection.`
				);
			}
		}

		validateFields(ast);

		applyFilters(ast);

		return ast;

		/**
		 * Traverses the AST and returns an array of all collections that are being fetched
		 */
		function getCollectionsFromAST(
			ast: AST | NestedCollectionAST
		): { collection: string; field: string }[] {
			const collections = [];

			if (ast.type === 'collection') {
				collections.push({
					collection: ast.name,
					field: (ast as NestedCollectionAST).fieldKey
						? (ast as NestedCollectionAST).fieldKey
						: null,
				});
			}

			for (const subAST of ast.children) {
				if (subAST.type === 'collection') {
					collections.push(...getCollectionsFromAST(subAST));
				}
			}

			return collections as { collection: string; field: string }[];
		}

		function validateFields(ast: AST | NestedCollectionAST) {
			if (ast.type === 'collection') {
				const collection = ast.name;

				// We check the availability of the permissions in the step before this is run
				const permissions = permissionsForCollections.find(
					(permission) => permission.collection === collection
				)!;

				const allowedFields = permissions.fields?.split(',') || [];

				for (const childAST of ast.children) {
					if (childAST.type === 'collection') {
						validateFields(childAST);
						continue;
					}

					if (allowedFields.includes('*')) continue;

					const fieldKey = childAST.name;

					if (allowedFields.includes(fieldKey) === false) {
						throw new ForbiddenException(
							`You don't have permission to access the "${fieldKey}" field.`
						);
					}
				}
			}
		}

		function applyFilters(
			ast: AST | NestedCollectionAST | FieldAST
		): AST | NestedCollectionAST | FieldAST {
			if (ast.type === 'collection') {
				const collection = ast.name;

				// We check the availability of the permissions in the step before this is run
				const permissions = permissionsForCollections.find(
					(permission) => permission.collection === collection
				)!;

				ast.query = {
					...ast.query,
					filter: {
						...(ast.query.filter || {}),
						...permissions.permissions,
					},
				};

				if (permissions.limit && ast.query.limit && ast.query.limit > permissions.limit) {
					throw new ForbiddenException(
						`You can't read more than ${permissions.limit} items at a time.`
					);
				}

				// Default to the permissions limit if limit hasn't been set
				if (permissions.limit && !ast.query.limit) {
					ast.query.limit = permissions.limit;
				}

				ast.children = ast.children.map(applyFilters) as (NestedCollectionAST | FieldAST)[];
			}

			return ast;
		}
	}

	/**
	 * Checks if the provided payload matches the configured permissions, and adds the presets to the payload.
	 */
	processValues(
		operation: Operation,
		collection: string,
		payloads: Partial<Item>[]
	): Promise<Partial<Item>[]>;
	processValues(
		operation: Operation,
		collection: string,
		payload: Partial<Item>
	): Promise<Partial<Item>>;
	async processValues(
		operation: Operation,
		collection: string,
		payload: Partial<Item>[] | Partial<Item>
	): Promise<Partial<Item>[] | Partial<Item>> {
		let payloads = Array.isArray(payload) ? payload : [payload];

		const permission = await this.knex
			.select<Permission>('*')
			.from('directus_permissions')
			.where({ operation, collection, role: this.accountability?.role || null })
			.first();

		if (!permission) throw new ForbiddenException();

		const allowedFields = permission.fields?.split(',') || [];

		if (allowedFields.includes('*') === false) {
			for (const payload of payloads) {
				const keysInData = Object.keys(payload);
				const invalidKeys = keysInData.filter(
					(fieldKey) => allowedFields.includes(fieldKey) === false
				);

				if (invalidKeys.length > 0) {
					throw new InvalidPayloadException(`Field "${invalidKeys[0]}" doesn't exist.`);
				}
			}
		}

		const preset = permission.presets || {};

		payloads = payloads.map((payload) => merge({}, preset, payload));

		const schema = generateJoi(permission.permissions);

		for (const payload of payloads) {
			const { error } = schema.validate(payload);

			if (error) {
				throw new InvalidPayloadException(error.message);
			}
		}

		if (Array.isArray(payload)) {
			return payloads;
		} else {
			return payloads[0];
		}
	}

	async checkAccess(operation: Operation, collection: string, pk: PrimaryKey | PrimaryKey[]) {
		const itemsService = new ItemsService(collection, { accountability: this.accountability });

		try {
			const query: Query = {
				fields: ['*'],
			};

			const result = await itemsService.readByKey(pk as any, query, operation);

			if (!result) throw '';
		} catch {
			throw new ForbiddenException(
				`You're not allowed to ${operation} item "${pk}" in collection "${collection}".`
			);
		}
	}
}
