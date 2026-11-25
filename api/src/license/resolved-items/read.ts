import { USER_INACTIVE_LICENSE_STATUS } from '@directus/constants';
import type {
	LicenseResolvedEntry,
	LicenseResolvedItems,
	LicenseResolvedKey,
	LicenseResolvedOutput,
	LicenseResolvedUser,
	SchemaOverview,
} from '@directus/types';
import { FlowsService } from '../../services/flows.js';
import { ItemsService, UsersService } from '../../services/index.js';
import { getSchema } from '../../utils/get-schema.js';
import { getEntitlementManager } from '../entitlements/manager.js';

const USER_FIELDS = ['id', 'first_name', 'last_name', 'avatar', 'email'];

async function readRows(
	key: LicenseResolvedKey,
	ids: string[],
	fields: string[],
	schema: SchemaOverview,
): Promise<Record<string, any>[]> {
	const query = { fields, filter: { id: { _in: ids } }, limit: -1 };

	if (key === 'collections') {
		const service = new ItemsService('directus_collections', { schema, accountability: null });

		const rows = await service.readByQuery({
			fields: ['collection', 'status'],
			filter: { collection: { _in: ids } },
			limit: -1,
		});

		return rows.map((row) => ({ id: row['collection'], status: row['status'] }));
	}

	if (key === 'flows') return new FlowsService({ schema, accountability: null }).readByQuery(query);

	return new UsersService({ schema, accountability: null }).readByQuery(query);
}

const DEACTIVATED_STATUS: Record<LicenseResolvedKey, string> = {
	collections: 'inactive',
	flows: 'inactive',
	seats: USER_INACTIVE_LICENSE_STATUS,
	sso_users: USER_INACTIVE_LICENSE_STATUS,
};

/** Keep only entries whose item still exists and is still deactivated */
export async function pruneResolvedItems(items: LicenseResolvedItems): Promise<LicenseResolvedItems> {
	const schema = await getSchema();
	const result: LicenseResolvedItems = {};

	for (const [key, entries] of Object.entries(items) as [LicenseResolvedKey, LicenseResolvedEntry[]][]) {
		if (!entries || entries.length === 0) continue;

		const rows = await readRows(
			key,
			entries.map((entry) => entry.id),
			['id', 'status'],
			schema,
		);

		const deactivated = new Set(
			rows.filter((row) => row['status'] === DEACTIVATED_STATUS[key]).map((row) => String(row['id'])),
		);

		const kept = entries.filter((entry) => deactivated.has(entry.id));

		if (kept.length > 0) result[key] = kept;
	}

	return result;
}

export async function toResolvedOutput(items: LicenseResolvedItems): Promise<LicenseResolvedOutput> {
	const schema = await getSchema();
	const entitlementManager = getEntitlementManager();
	const output: LicenseResolvedOutput = {};

	async function withRows<T extends Record<string, unknown>>(key: LicenseResolvedKey, fields: string[]) {
		const entries = items[key]!;

		const rows = await readRows(
			key,
			entries.map((entry) => entry.id),
			fields,
			schema,
		);

		const byId = new Map(rows.map((row) => [String(row['id']), row]));

		return entries.flatMap((entry) => {
			const row = byId.get(entry.id);
			return row ? [{ ...(row as T), resolved_at: entry.resolved_at }] : [];
		});
	}

	async function limitOf(key: 'collections' | 'flows' | 'seats') {
		const { hardLimit, usage } = await entitlementManager.check(key);
		return { limit: hardLimit, usage };
	}

	if (items.collections?.length) {
		output.collections = {
			...(await limitOf('collections')),
			candidates: items.collections.map((entry) => ({ id: entry.id, resolved_at: entry.resolved_at })),
		};
	}

	if (items.flows?.length) {
		output.flows = {
			...(await limitOf('flows')),
			candidates: await withRows<{ id: string; name: string }>('flows', ['id', 'name']),
		};
	}

	if (items.seats?.length) {
		output.seats = {
			...(await limitOf('seats')),
			candidates: await withRows<LicenseResolvedUser>('seats', USER_FIELDS),
		};
	}

	if (items.sso_users?.length) {
		output.sso_users = {
			entitled: entitlementManager.isEntitled('sso_enabled'),
			...(await limitOf('seats')),
			candidates: await withRows<LicenseResolvedUser>('sso_users', USER_FIELDS),
		};
	}

	return output;
}
