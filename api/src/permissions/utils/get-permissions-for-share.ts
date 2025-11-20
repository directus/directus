import { schemaPermissions } from '@directus/system-data';
import type { Accountability, Filter, Permission, SchemaOverview } from '@directus/types';
import { set, uniq } from 'lodash-es';
import { reduceSchema } from '../../utils/reduce-schema.js';
import { fetchPermissions } from '../lib/fetch-permissions.js';
import { fetchPolicies } from '../lib/fetch-policies.js';
import { fetchRolesTree } from '../lib/fetch-roles-tree.js';
import { fetchAllowedFieldMap } from '../modules/fetch-allowed-field-map/fetch-allowed-field-map.js';
import { fetchGlobalAccess } from '../modules/fetch-global-access/fetch-global-access.js';
import type { Context } from '../types.js';
import { fetchShareInfo } from './fetch-share-info.js';
import { mergePermissions } from './merge-permissions.js';

export async function getPermissionsForShare(
	accountability: Pick<Accountability, 'share' | 'ip'>,
	collections: string[] | undefined,
	context: Context,
): Promise<Permission[]> {
	const defaults: Permission = {
		action: 'read',
		collection: '',
		permissions: {},
		policy: null,
		validation: null,
		presets: null,
		fields: null,
	};

	const { collection, item, role, user_created } = await fetchShareInfo(accountability.share!, context);

	const userAccountability: Accountability = {
		user: user_created.id,
		role: user_created.role,
		roles: await fetchRolesTree(user_created.role, { knex: context.knex }),
		admin: false,
		app: false,
		ip: accountability.ip,
	};

	// Fallback to public accountability so merging later on has no issues
	const shareAccountability: Accountability = {
		user: null,
		role: role,
		roles: await fetchRolesTree(role, { knex: context.knex }),
		admin: false,
		app: false,
		ip: accountability.ip,
	};

	const [
		{ admin: shareIsAdmin },
		{ admin: userIsAdmin },
		userPermissions,
		sharePermissions,
		shareFieldMap,
		userFieldMap,
	] = await Promise.all([
		fetchGlobalAccess(shareAccountability, context.knex),
		fetchGlobalAccess(userAccountability, context.knex),
		getPermissionsForAccountability(userAccountability, context),
		getPermissionsForAccountability(shareAccountability, context),
		fetchAllowedFieldMap(
			{
				accountability: shareAccountability,
				action: 'read',
			},
			context,
		),
		fetchAllowedFieldMap(
			{
				accountability: userAccountability,
				action: 'read',
			},
			context,
		),
	]);

	const isAdmin = userIsAdmin && shareIsAdmin;

	let permissions: Permission[] = [];
	let reducedSchema: SchemaOverview;

	if (isAdmin) {
		defaults.fields = ['*'];
		reducedSchema = context.schema;
	} else if (userIsAdmin && !shareIsAdmin) {
		permissions = sharePermissions;
		reducedSchema = reduceSchema(context.schema, shareFieldMap);
	} else if (shareIsAdmin && !userIsAdmin) {
		permissions = userPermissions;
		reducedSchema = reduceSchema(context.schema, userFieldMap);
	} else {
		permissions = mergePermissions('intersection', sharePermissions, userPermissions);
		reducedSchema = reduceSchema(context.schema, shareFieldMap);
		reducedSchema = reduceSchema(reducedSchema, userFieldMap);
	}

	if (!isAdmin) defaults.fields = permissions.find((perm) => perm.collection === collection)?.fields ?? [];

	const parentPrimaryKeyField = context.schema.collections[collection]!.primary;

	const relationalPermissions = traverse(reducedSchema, parentPrimaryKeyField, item, collection);

	const parentCollectionPermission: Permission = {
		...defaults,
		collection,
		permissions: {
			[parentPrimaryKeyField]: {
				_eq: item,
			},
		},
	};

	// All permissions that will be merged into the original permissions set
	const allGeneratedPermissions = [
		parentCollectionPermission,
		...relationalPermissions.map((generated) => ({ ...defaults, ...generated })),
		...schemaPermissions,
	];

	// All the collections that are touched through the relational tree from the current root collection, and the schema collections
	const allowedCollections = uniq(allGeneratedPermissions.map(({ collection }) => collection));

	const generatedPermissions: Permission[] = [];

	// Merge all the permissions that relate to the same collection with an _or (this allows you to properly retrieve)
	// the items of a collection if you entered that collection from multiple angles
	for (const collection of allowedCollections) {
		const permissionsForCollection = allGeneratedPermissions.filter(
			(permission) => permission.collection === collection,
		);

		if (permissionsForCollection.length > 0) {
			generatedPermissions.push(...mergePermissions('or', permissionsForCollection));
		} else {
			generatedPermissions.push(...permissionsForCollection);
		}
	}

	if (isAdmin) {
		return filterCollections(collections, generatedPermissions);
	}

	// Explicitly filter out permissions to collections unrelated to the root parent item.
	const limitedPermissions = permissions.filter(
		({ action, collection }) => allowedCollections.includes(collection) && action === 'read',
	);

	return filterCollections(collections, mergePermissions('and', limitedPermissions, generatedPermissions));
}

function filterCollections(collections: string[] | undefined, permissions: Permission[]): Permission[] {
	if (!collections) {
		return permissions;
	}

	return permissions.filter(({ collection }) => collections.includes(collection));
}

async function getPermissionsForAccountability(
	accountability: Accountability,
	context: Context,
): Promise<Permission[]> {
	const policies = await fetchPolicies(accountability, context);

	return fetchPermissions(
		{
			policies,
			accountability,
		},
		context,
	);
}

export function traverse(
	schema: SchemaOverview,
	rootItemPrimaryKeyField: string,
	rootItemPrimaryKey: string,
	currentCollection: string,
	parentCollections: string[] = [],
	path: string[] = [],
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
					[...path, relation.field],
				),
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
						rootItemPrimaryKey,
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
					rootItemPrimaryKey,
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
						[...path, relation.meta?.one_field],
					),
				);
			}
		}
	}

	return permissions;
}

function getFilterForPath(
	type: 'o2m' | 'm2o' | 'a2o',
	path: string[],
	rootPrimaryKeyField: string,
	rootPrimaryKey: string,
): Filter {
	const filter: Filter = {};

	if (type === 'm2o' || type === 'a2o') {
		set(filter, path.reverse(), { [rootPrimaryKeyField]: { _eq: rootPrimaryKey } });
	} else {
		set(filter, path.reverse(), { _eq: rootPrimaryKey });
	}

	return filter;
}
