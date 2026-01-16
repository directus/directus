import type { Accountability, Permission, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { isEmpty } from 'lodash-es';
import { fetchPermissions } from '../../../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../../../permissions/lib/fetch-policies.js';
import { extractRequiredDynamicVariableContextForPermissions } from '../../../permissions/utils/extract-required-dynamic-variable-context.js';
import { fetchDynamicVariableData } from '../../../permissions/utils/fetch-dynamic-variable-data.js';
import { processPermissions } from '../../../permissions/utils/process-permissions.js';
import { ItemsService } from '../../../services/index.js';
import { filterItems } from '../../../utils/filter-items.js';
import { isFieldAllowed } from '../../../utils/is-field-allowed.js';
import { asyncDeepMapWithSchema, isDetailedUpdateSyntax } from '../../../utils/versioning/deep-map-with-schema.js';

/**
 * Filters a payload based on the recipient's read permissions.
 * Uses `allowedFields` for root collection if provided, otherwise fetches permissions.
 */
export async function sanitizePayload(
	collection: string,
	payload: Record<string, unknown>,
	ctx: { knex: Knex; schema: SchemaOverview; accountability: Accountability },
	allowedFields?: string[],
) {
	const { accountability, schema } = ctx;

	// Fetch permissions for nested collection checks
	const policies = await fetchPolicies(accountability, { knex: ctx.knex, schema: ctx.schema });

	const rawPermissions = await fetchPermissions(
		{ policies, accountability, action: 'read', bypassDynamicVariableProcessing: true },
		{ knex: ctx.knex, schema: ctx.schema },
	);

	const dynamicVariableContext = extractRequiredDynamicVariableContextForPermissions(rawPermissions);

	const permissionsContext = await fetchDynamicVariableData(
		{ accountability, policies, dynamicVariableContext },
		{ knex: ctx.knex, schema: ctx.schema },
	);

	const processedPermissions = processPermissions({
		permissions: rawPermissions,
		accountability,
		permissionsContext,
	});

	const permissionsByCollection = processedPermissions.reduce<Record<string, Permission[]>>((acc, perm) => {
		if (!(perm.collection in acc)) acc[perm.collection] = [];
		acc[perm.collection]!.push(perm);
		return acc;
	}, {});

	const rootCollection = collection;

	const serviceCache = new Map<string, ItemsService<any>>();

	const getService = (collection: string, admin = false) => {
		const cacheKey = `${collection}:${admin}`;

		if (!serviceCache.has(cacheKey)) {
			serviceCache.set(
				cacheKey,
				new ItemsService(collection, admin ? { ...ctx, accountability: { admin: true } as any } : ctx),
			);
		}

		return serviceCache.get(cacheKey)!;
	};

	// Cache item reads to prevent N+1 queries
	const itemReadCache = new Map<string, Promise<Record<string, any> | null>>();

	return await asyncDeepMapWithSchema(
		payload,
		async ([key, value], context) => {
			if (context.field.special.some((v) => v === 'conceal' || v === 'hash')) return;

			// Skip empty relation values
			if ((context.relationType === 'm2o' || context.relationType === 'a2o') && isEmpty(value)) return;

			// Filter empty items from O2M arrays
			if ((context.relationType === 'o2m' || context.relationType === 'o2a') && typeof value === 'object') {
				if (Array.isArray(value)) {
					value = (value as Array<unknown>).filter((v) => !isEmpty(v));
					if ((value as Array<unknown>).length === 0) return;
				} else if (isDetailedUpdateSyntax(value)) {
					const filtered = {
						create: value.create.filter((v) => !isEmpty(v)),
						update: value.update.filter((v) => !isEmpty(v)),
						delete: value.delete.filter((v) => !isEmpty(v)),
					};

					// Omit field if all operations are empty
					if (filtered.create.length === 0 && filtered.update.length === 0 && filtered.delete.length === 0) {
						return;
					}

					value = filtered;
				}
			}

			const currentCollection = context.collection.collection;
			const isRootCollection = currentCollection === rootCollection;
			const collectionPerms = permissionsByCollection[currentCollection] || [];

			// Check field + item-level permissions
			const isItemFieldAllowed = (item: Record<string, any>) => {
				return collectionPerms.some((perm) => {
					if (!isFieldAllowed(perm.fields ?? [], String(key))) return false;
					if (!perm.permissions || Object.keys(perm.permissions).length === 0) return true;
					return filterItems([item], perm.permissions).length > 0;
				});
			};

			let readAllowed = false;

			const isUpdate = !isRootCollection && context.collection.primary in context.object;

			if (accountability.admin === true) {
				readAllowed = true;
			} else if (isRootCollection && allowedFields) {
				readAllowed = isFieldAllowed(allowedFields, String(key));
			} else {
				if (isUpdate) {
					// Nested update: field-level check only (item check done later via DB)
					readAllowed =
						permissionsByCollection[currentCollection]?.some((perm) =>
							isFieldAllowed(perm.fields ?? [], String(key)),
						) ?? false;
				} else {
					// Nested create: check permissions against payload data
					readAllowed = isItemFieldAllowed(context.object as Record<string, any>);
				}
			}

			if (!readAllowed) return;

			// For nested updates, verify item-level permissions via DB lookup
			if (isUpdate && accountability.admin !== true) {
				const pk = context.object[context.collection.primary] as string | number;
				const cacheKey = `${currentCollection}:${pk}`;

				if (!itemReadCache.has(cacheKey)) {
					const sudoService = getService(currentCollection, true);

					itemReadCache.set(
						cacheKey,
						(async () => {
							try {
								return await sudoService.readOne(pk, { fields: ['*'] });
							} catch {
								return null;
							}
						})(),
					);
				}

				const itemOrStatus = await itemReadCache.get(cacheKey)!;

				if (itemOrStatus === null) {
					if (!isItemFieldAllowed(context.object as Record<string, any>)) return;
				} else {
					if (!isItemFieldAllowed(itemOrStatus as Record<string, any>)) return;
				}
			}

			return [key, value];
		},
		{
			schema,
			collection,
		},
		{
			detailedUpdateSyntax: true,
			omitUnknownFields: true,
			mapPrimaryKeys: true,
		},
	);
}
