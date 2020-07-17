import {
	Accountability,
	AST,
	NestedCollectionAST,
	FieldAST,
	Query,
	Permission,
	Operation,
	Item,
} from '../types';
import * as ItemsService from './items';
import database from '../database';
import { ForbiddenException, InvalidPayloadException } from '../exceptions';
import { uniq } from 'lodash';
import generateJoi from '../utils/generate-joi';

export const createPermission = async (
	data: Partial<Item>,
	accountability: Accountability
): Promise<number> => {
	return (await ItemsService.createItem('directus_permissions', data, accountability)) as number;
};

export const readPermissions = async (query: Query, accountability?: Accountability) => {
	return await ItemsService.readItems('directus_permissions', query, accountability);
};

export const readPermission = async (pk: number, query: Query, accountability?: Accountability) => {
	return await ItemsService.readItem('directus_permissions', pk, query, accountability);
};

export const updatePermission = async (
	pk: number,
	data: Partial<Item>,
	accountability: Accountability
): Promise<number> => {
	return (await ItemsService.updateItem(
		'directus_permissions',
		pk,
		data,
		accountability
	)) as number;
};

export const deletePermission = async (pk: number, accountability: Accountability) => {
	await ItemsService.deleteItem('directus_permissions', pk, accountability);
};

export const processAST = async (
	ast: AST,
	role: string | null,
	operation: Operation = 'read'
): Promise<AST> => {
	const collectionsRequested = getCollectionsFromAST(ast);

	const permissionsForCollections = await database
		.select<Permission[]>('*')
		.from('directus_permissions')
		.where({ operation, role })
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
		);

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
	function getCollectionsFromAST(ast: AST | NestedCollectionAST) {
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

		return collections;
	}

	function validateFields(ast: AST | NestedCollectionAST) {
		if (ast.type === 'collection') {
			const collection = ast.name;
			const permissions = permissionsForCollections.find(
				(permission) => permission.collection === collection
			);
			const allowedFields = permissions.fields.split(',');

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

			const permissions = permissionsForCollections.find(
				(permission) => permission.collection === collection
			);

			ast.query = {
				...ast.query,
				filter: {
					...(ast.query.filter || {}),
					...permissions.permissions,
				},
			};

			if (permissions.limit && ast.query.limit > permissions.limit) {
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
};

export const processValues = async (
	operation: Operation,
	collection: string,
	role: string | null,
	data: Partial<Item>
) => {
	const permission = await database
		.select<Permission>('*')
		.from('directus_permissions')
		.where({ operation, collection, role })
		.first();

	if (!permission) throw new ForbiddenException();

	const allowedFields = permission.fields.split(',');

	if (allowedFields.includes('*') === false) {
		const keysInData = Object.keys(data);
		const invalidKeys = keysInData.filter(
			(fieldKey) => allowedFields.includes(fieldKey) === false
		);

		if (invalidKeys.length > 0) {
			throw new InvalidPayloadException(`Field "${invalidKeys[0]}" doesn't exist.`);
		}
	}

	const preset = permission.presets || {};

	const payload = {
		...preset,
		...data,
	};

	const schema = generateJoi(permission.permissions);

	const { error } = schema.validate(payload);

	if (error) {
		throw new InvalidPayloadException(error.message);
	}

	return payload;
};

export const checkAccess = async (
	operation: Operation,
	collection: string,
	pk: string | number,
	role: string
) => {
	try {
		const query: Query = {
			fields: ['*'],
		};

		const result = await ItemsService.readItem(collection, pk, query, { role }, operation);

		if (!result) throw '';
	} catch {
		throw new ForbiddenException(
			`You're not allowed to ${operation} item "${pk}" in collection "${collection}".`
		);
	}
};
