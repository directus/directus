import { Permission, Accountability, Filter } from '@directus/shared/types';
import { SchemaOverview } from '../types';
import { assign, set } from 'lodash';
import { mergePermissions } from './merge-permissions';
import { schemaPermissions } from '../database/system-data/app-access-permissions';
import { reduceSchema } from './reduce-schema';
import { getRelationType } from './get-relation-type';

export function mergePermissionsForShare(
	currentPermissions: Permission[],
	accountability: Accountability,
	schema: SchemaOverview
): Permission[] {
	const defaults: Permission = {
		id: undefined,
		action: 'read',
		role: accountability.role,
		collection: '',
		permissions: {},
		validation: {},
		presets: null,
		fields: null,
	};

	const { collection, item } = accountability.share_scope!;

	const parentPrimaryKeyField = schema.collections[collection].primary;

	const reducedSchema = reduceSchema(schema, currentPermissions, ['read']);

	const generatedPermissions = traverse(reducedSchema, item, collection);

	console.dir(generatedPermissions, { depth: null });

	const parentCollectionPermission: Permission = assign({}, defaults, {
		collection,
		permissions: {
			[parentPrimaryKeyField]: {
				_eq: item,
			},
		},
	});

	// Strip out any generated permissions to collections you didn't have access to before
	const permissionsToMergeIn = [
		parentCollectionPermission,
		...generatedPermissions.map((generated) => assign({}, defaults, generated)),
	];

	return mergePermissions('and', currentPermissions, schemaPermissions, permissionsToMergeIn);
}

export function traverse(
	schema: SchemaOverview,
	rootItemPrimaryKey: string,
	currentCollection: string,
	path: string[] = []
): Partial<Permission>[] {
	const permissions: Partial<Permission>[] = [];

	const relationsInCollection = schema.relations.filter((relation) => {
		return relation.collection === currentCollection || relation.related_collection === currentCollection;
	});

	for (const relation of relationsInCollection) {
		let type;

		if (relation.related_collection === currentCollection) {
			type = 'o2m';
		} else if (!relation.related_collection) {
			type = 'm2a';
		} else {
			type = 'm2o';
		}

		if (type === 'o2m') {
			permissions.push({
				collection: relation.collection,
				permissions: getFilterForPath([...path, relation.field], rootItemPrimaryKey),
			});

			permissions.push(...traverse(schema, rootItemPrimaryKey, relation.collection, [...path, relation.field]));
		}

		if (type === 'm2a') {
			// @TODO M2A
			throw new Error('m2a support not implemented yet');
		}

		if (type === 'm2o') {
			permissions.push({
				collection: relation.related_collection!,
				permissions: getFilterForPath(
					[...path, `$FOLLOW(${relation.collection},${relation.field})`],
					rootItemPrimaryKey
				),
			});
		}
	}

	return permissions;
}

export function getFilterForPath(path: string[], rootPrimaryKey: string): Filter {
	const filter: Filter = {};

	set(filter, path.reverse(), { _eq: rootPrimaryKey });

	return filter;
}
