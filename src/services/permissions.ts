import {
	Accountability,
	AST,
	NestedCollectionAST,
	FieldAST,
	Operation,
	Query,
	Permission,
	Relation,
} from '../types';
import * as ItemsService from './items';
import database from '../database';
import { ForbiddenException } from '../exceptions';
import { uniq } from 'lodash';

export const createPermission = async (
	data: Record<string, any>,
	accountability: Accountability
): Promise<number> => {
	return (await ItemsService.createItem('directus_permissions', data, accountability)) as number;
};

export const readPermissions = async (query: Query) => {
	// return await ItemsService.readItems('directus_permissions', query);
};

export const readPermission = async (pk: number, query: Query) => {
	return await ItemsService.readItem('directus_permissions', pk, query);
};

export const updatePermission = async (
	pk: number,
	data: Record<string, any>,
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

export const authorize = async (operation: Operation, collection: string, role?: string) => {
	const query: Query = {
		filter: {
			collection: {
				_eq: collection,
			},
			operation: {
				_eq: operation,
			},
		},
		limit: 1,
	};

	if (role) {
		query.filter.role = {
			_eq: role,
		};
	}

	// const records = await ItemsService.readItems<Permission>('directus_permissions', query);

	// return records[0];
};

export const processAST = async (role: string | null, ast: AST): Promise<AST> => {
	const collectionsRequested = getCollectionsFromAST(ast);

	const permissionsForCollections = await database
		.select<Permission[]>('*')
		.from('directus_permissions')
		.whereIn(
			'collection',
			collectionsRequested.map(({ collection }) => collection)
		)
		.andWhere('role', role);

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

			ast.children = ast.children.map(applyFilters) as (NestedCollectionAST | FieldAST)[];
		}

		return ast;
	}
};
