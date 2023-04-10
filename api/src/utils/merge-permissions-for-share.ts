import type { Accountability, Filter, Permission, SchemaOverview } from '@directus/types';
import { assign, set, uniq } from 'lodash-es';
import { schemaPermissions } from '../database/system-data/app-access-permissions/index.js';
import { mergePermissions } from './merge-permissions.js';
import { reduceSchema } from './reduce-schema.js';

export function mergePermissionsForShare(
	currentPermissions: Permission[],
	accountability: Accountability,
	schema: SchemaOverview
): Permission[] {
	const defaults: Permission = {
		action: 'read',
		role: accountability.role,
		collection: '',
		permissions: {},
		validation: null,
		presets: null,
		fields: null,
	};

	const { collection, item } = accountability.share_scope!;

	const parentPrimaryKeyField = schema.collections[collection]!.primary;

	const reducedSchema = reduceSchema(schema, currentPermissions, ['read']);

	const relationalPermissions = traverse(reducedSchema, parentPrimaryKeyField, item, collection);

	const parentCollectionPermission: Permission = assign({}, defaults, {
		collection,
		permissions: {
			[parentPrimaryKeyField]: {
				_eq: item,
			},
		},
	});

	// All permissions that will be merged into the original permissions set
	const allGeneratedPermissions = [
		parentCollectionPermission,
		...relationalPermissions.map((generated) => assign({}, defaults, generated)),
		...schemaPermissions,
	];

	// All the collections that are touched through the relational tree from the current root collection, and the schema collections
	const allowedCollections = uniq(allGeneratedPermissions.map(({ collection }) => collection));

	const generatedPermissions: Permission[] = [];

	// Merge all the permissions that relate to the same collection with an _or (this allows you to properly retrieve)
	// the items of a collection if you entered that collection from multiple angles
	for (const collection of allowedCollections) {
		const permissionsForCollection = allGeneratedPermissions.filter(
			(permission) => permission.collection === collection
		);

		if (permissionsForCollection.length > 0) {
			generatedPermissions.push(...mergePermissions('or', permissionsForCollection));
		} else {
			generatedPermissions.push(...permissionsForCollection);
		}
	}

	// Explicitly filter out permissions to collections unrelated to the root parent item.
	const limitedPermissions = currentPermissions.filter(
		({ action, collection }) => allowedCollections.includes(collection) && action === 'read'
	);

	return mergePermissions('and', limitedPermissions, generatedPermissions);
}

export function traverse(
	schema: SchemaOverview,
	rootItemPrimaryKeyField: string,
	rootItemPrimaryKey: string,
	currentCollection: string,
	parentCollections: string[] = [],
	path: string[] = []
): Partial<Permission>[] {
	const permissions: Partial<Permission>[] = [];

	// If there's already a permissions rule for the collection we're currently checking, we'll shortcircuit.
	// This prevents infinite loop in recursive relationships, like articles->related_articles->articles, or
	// articles.author->users.avatar->files.created_by->users.avatar->files.created_by->🔁
	if (parentCollections.includes(currentCollection)) {
		return permissions;
	}

	const relationsInCollection = schema.relations.filter((relation) => {
		return relation.collection === currentCollection || relation.related_collection === currentCollection;
	});

	for (const relation of relationsInCollection) {
		let type;

		if (relation.related_collection === currentCollection) {
			type = 'o2m';
		} else if (!relation.related_collection) {
			type = 'a2o';
		} else {
			type = 'm2o';
		}

		if (type === 'o2m') {
			permissions.push({
				collection: relation.collection,
				permissions: getFilterForPath(type, [...path, relation.field], rootItemPrimaryKeyField, rootItemPrimaryKey),
			});

			permissions.push(
				...traverse(
					schema,
					rootItemPrimaryKeyField,
					rootItemPrimaryKey,
					relation.collection,
					[...parentCollections, currentCollection],
					[...path, relation.field]
				)
			);
		}

		if (type === 'a2o' && relation.meta?.one_allowed_collections) {
			for (const collection of relation.meta.one_allowed_collections) {
				permissions.push({
					collection,
					permissions: getFilterForPath(
						type,
						[...path, `$FOLLOW(${relation.collection},${relation.field},${relation.meta.one_collection_field})`],
						rootItemPrimaryKeyField,
						rootItemPrimaryKey
					),
				});
			}
		}

		if (type === 'm2o') {
			permissions.push({
				collection: relation.related_collection!,
				permissions: getFilterForPath(
					type,
					[...path, `$FOLLOW(${relation.collection},${relation.field})`],
					rootItemPrimaryKeyField,
					rootItemPrimaryKey
				),
			});

			if (relation.meta?.one_field) {
				permissions.push(
					...traverse(
						schema,
						rootItemPrimaryKeyField,
						rootItemPrimaryKey,
						relation.related_collection!,
						[...parentCollections, currentCollection],
						[...path, relation.meta?.one_field]
					)
				);
			}
		}
	}

	return permissions;
}

export function getFilterForPath(
	type: 'o2m' | 'm2o' | 'a2o',
	path: string[],
	rootPrimaryKeyField: string,
	rootPrimaryKey: string
): Filter {
	const filter: Filter = {};

	if (type === 'm2o' || type === 'a2o') {
		set(filter, path.reverse(), { [rootPrimaryKeyField]: { _eq: rootPrimaryKey } });
	} else {
		set(filter, path.reverse(), { _eq: rootPrimaryKey });
	}

	return filter;
}
