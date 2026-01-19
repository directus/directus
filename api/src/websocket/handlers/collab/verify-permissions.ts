import type { Accountability, PrimaryKey, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { useLogger } from '../../../logger/index.js';
import { fetchPermissions } from '../../../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../../../permissions/lib/fetch-policies.js';
import { fetchAllowedFields } from '../../../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js';
import { validateItemAccess } from '../../../permissions/modules/validate-access/lib/validate-item-access.js';
import { extractRequiredDynamicVariableContextForPermissions } from '../../../permissions/utils/extract-required-dynamic-variable-context.js';
import { fetchDynamicVariableData } from '../../../permissions/utils/fetch-dynamic-variable-data.js';
import { processPermissions } from '../../../permissions/utils/process-permissions.js';
import { getService } from '../../../utils/get-service.js';
import { calculateCacheMetadata } from './calculate-cache-metadata.js';
import { filterToFields } from './filter-to-fields.js';
import { permissionCache } from './permissions-cache.js';

/**
 * Verify if a client has permissions to perform an action on the item
 */
export async function verifyPermissions(
	accountability: Accountability | null,
	collection: string,
	item: PrimaryKey | null,
	action: 'create' | 'read' | 'update' | 'delete' = 'read',
	options: { knex: Knex; schema: SchemaOverview },
) {
	if (!accountability) return [];

	const { schema, knex } = options;

	if (!schema.collections[collection]) return [];

	if (accountability.admin) return ['*'];

	const cached = permissionCache.get(accountability, collection, String(item), action);
	if (cached) return cached;

	// Prevent caching stale permissions if invalidation occurs during async steps
	const startInvalidationCount = permissionCache.getInvalidationCount();

	const service = getService(collection, { schema, knex, accountability });

	let itemData: any = null;

	try {
		const policies = await fetchPolicies(accountability, { knex, schema });

		const rawPermissions = await fetchPermissions(
			{ action, collections: [collection], policies, accountability, bypassDynamicVariableProcessing: true },
			{ knex, schema },
		);

		// Resolve dynamic variables used in the permission filters
		const dynamicVariableContext = extractRequiredDynamicVariableContextForPermissions(rawPermissions);

		const permissionsContext = await fetchDynamicVariableData(
			{ accountability, policies, dynamicVariableContext },
			{ knex, schema },
		);

		const processedPermissions = processPermissions({
			permissions: rawPermissions,
			accountability,
			permissionsContext,
		});

		const fieldsToFetch = processedPermissions
			.map((perm) => (perm.permissions ? filterToFields(perm.permissions, collection, schema) : []))
			.flat();

		// Check for item-level rules to skip DB fetch
		const hasItemRules = processedPermissions.some((p) => p.permissions && Object.keys(p.permissions).length > 0);

		// Fetch current item data to evaluate any conditional permission filters based on record state
		if (hasItemRules) {
			if (item && action !== 'create') {
				itemData = await service.readOne(item, {
					fields: fieldsToFetch,
				});

				if (!itemData) throw new Error('No access');
			} else if (schema.collections[collection]?.singleton) {
				const pkField = schema.collections[collection]!.primary;

				if (pkField) {
					if (Array.from(fieldsToFetch).some((field) => field === '*' || field === pkField) === false) {
						fieldsToFetch.push(pkField);
					}
				}

				itemData = await service.readSingleton({ fields: fieldsToFetch });
			}
		}

		let allowedFields: string[] = [];

		if ((item || schema.collections[collection]?.singleton) && hasItemRules) {
			const primaryKeys: (string | number)[] = item ? [item] : [];

			const validationContext = {
				collection,
				accountability,
				action,
				primaryKeys,
				returnAllowedRootFields: true,
			};

			allowedFields = (await validateItemAccess(validationContext, { knex, schema })).allowedRootFields || [];
		} else {
			allowedFields = await fetchAllowedFields({ accountability, action, collection }, { knex, schema });
		}

		// Determine TTL and relational dependencies for cache invalidation
		const { ttlMs, dependencies } = calculateCacheMetadata(
			collection,
			itemData,
			rawPermissions,
			schema,
			accountability,
		);

		// Only cache if the state hasn't been invalidated by another operation in the meantime
		if (permissionCache.getInvalidationCount() === startInvalidationCount) {
			permissionCache.set(accountability, collection, String(item), action, allowedFields, dependencies, ttlMs);
		}

		return allowedFields;
	} catch (err) {
		useLogger().error(
			err,
			`[Collab] verifyPermissions failed for user "${accountability.user}", collection "${collection}", and item "${item}"`,
		);

		return [];
	}
}
