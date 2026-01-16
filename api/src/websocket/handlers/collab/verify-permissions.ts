import type { Accountability, PrimaryKey } from '@directus/types';
import getDatabase from '../../../database/index.js';
import { useLogger } from '../../../logger/index.js';
import { fetchPermissions } from '../../../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../../../permissions/lib/fetch-policies.js';
import { validateItemAccess } from '../../../permissions/modules/validate-access/lib/validate-item-access.js';
import { extractRequiredDynamicVariableContextForPermissions } from '../../../permissions/utils/extract-required-dynamic-variable-context.js';
import { fetchDynamicVariableData } from '../../../permissions/utils/fetch-dynamic-variable-data.js';
import { processPermissions } from '../../../permissions/utils/process-permissions.js';
import { getSchema } from '../../../utils/get-schema.js';
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
	action: 'read' | 'update' = 'read',
) {
	if (!accountability) return [];
	if (accountability.admin) return ['*'];

	const cached = permissionCache.get(accountability, collection, String(item), action);
	if (cached) return cached;

	// Prevent caching stale permissions if an invalidation occurs during async steps
	const startInvalidationCount = permissionCache.getInvalidationCount();

	const schema = await getSchema();
	const knex = getDatabase();

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

		// Fetch current item data to evaluate any conditional permission filters based on record state
		if (item) {
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

		// TODO: Check which approach might be faster better: Checking it JS or DB side
		// const allowedFields = calculateAllowedFields(collection, processedPermissions, itemData, schema);
		const primaryKeys: (string | number)[] = item ? [item] : [];

		const validationContext = {
			collection,
			accountability,
			action,
			primaryKeys,
			returnAllowedRootFields: true,
		};

		const allowedFields = (await validateItemAccess(validationContext, { knex, schema })).allowedRootFields || [];

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
			`[Collab] Room.verifyPermissions failed for user "${accountability.user}", collection "${collection}", and item "${item}"`,
		);

		return [];
	}
}
