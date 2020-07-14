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

				const fieldKey = childAST.name;
				if (allowedFields.includes(fieldKey) === false) {
					throw new ForbiddenException(
						`You don't have permission to access the "${fieldKey}" field.`
					);
				}
			}
		}
	}
};

/*
// Swap *.* case for *,<relational-field>.*,<another-relational>.*
for (let index = 0; index < fields.length; index++) {
	const fieldKey = fields[index];

	if (fieldKey.includes('.') === false) continue;

	const parts = fieldKey.split('.');

	if (parts[0] === '*') {
		const availableFields = await FieldsService.fieldsInCollection(parentCollection);
		const allowedCollections = permissions.map(({ collection }) => collection);

		const relationalFields = availableFields.filter((field) => {
			const relation = getRelation(parentCollection, field);
			if (!relation) return false;

			return (
				allowedCollections.includes(relation.collection_one) &&
				allowedCollections.includes(relation.collection_many)
			);
		});

		const nestedFieldKeys = relationalFields.map(
			(relationalField) => `${relationalField}.${parts.slice(1).join('.')}`
		);

		fields.splice(index, 1, ...nestedFieldKeys);

		fields.push('*');
	}
}


function convertWildcards(ast: AST | NestedCollectionAST) {
	if (ast.type === 'collection') {
		const permission = permissionsForCollections.find(
			(permission) => permission.collection === ast.name
		);

		const wildcardIndex = ast.children.findIndex((nestedAST) => {
			return nestedAST.type === 'field' && nestedAST.name === '*';
		});

		// Replace wildcard with array of fields you're allowed to read
		if (wildcardIndex !== -1) {
			const allowedFields = permission?.fields;

			if (allowedFields !== '*') {
				const currentFieldKeys = ast.children.map((field) => field.type === 'field' ? field.name : field.fieldKey);
				console.log(currentFieldKeys);
				const fields: FieldAST[] = allowedFields
					.split(',')
					// Make sure we don't include nested collections as columns
					.filter((fieldKey) => {
						console.log(currentFieldKeys, fieldKey, currentFieldKeys.includes(fieldKey));
						return currentFieldKeys.includes(fieldKey) === false;
					})
					.map((fieldKey) => ({ type: 'field', name: fieldKey }));

				ast.children.splice(wildcardIndex, 1, ...fields);
			}
		}

		ast.children = ast.children
			.map((childAST) => {
				if (childAST.type === 'collection') {
					return convertWildcards(childAST) as NestedCollectionAST | FieldAST;
				}

				return childAST;
			})
			.filter((c) => c);
	}

	return ast;
}
*/
